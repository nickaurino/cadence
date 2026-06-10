import ExpoModulesCore
import MusicKit
import MediaPlayer
import Combine

public final class CadenceMusicKitModule: Module {
  private var cancellables = Set<AnyCancellable>()
  // Dedupe key for track-change events. The queue ENTRY id (unique per queue
  // slot), not the catalog id: the same song appearing twice in a queue, or a
  // replay of the song that just ended, is a real track change.
  private var lastEntryId: String?

  public func definition() -> ModuleDefinition {
    Name("CadenceMusicKit")

    Events("onTrackChange")

    OnStartObserving {
      self.startObserving()
    }

    OnStopObserving {
      self.cancellables.removeAll()
      self.lastEntryId = nil
    }

    AsyncFunction("authorize") { () async -> Bool in
      let status = await MusicAuthorization.request()
      return status == .authorized
    }

    AsyncFunction("isAvailable") { () -> Bool in
      return MusicAuthorization.currentStatus == .authorized
    }

    AsyncFunction("search") { (term: String, limit: Int, offset: Int) async throws -> [[String: Any]] in
      var request = MusicCatalogSearchRequest(term: term, types: [Song.self])
      // Apple Music caps catalog search at 25 results per request. Offset pages
      // through results so re-searches return fresh songs.
      request.limit = min(max(limit, 1), 25)
      request.offset = max(offset, 0)
      let response = try await request.response()

      // Return raw song metadata only. Apple's catalog exposes no tempo, so
      // BPM is resolved later in JS from an external source keyed by ISRC.
      return response.songs.map { song in
        [
          "id": song.id.rawValue,
          "name": song.title,
          "artist": song.artistName,
          "albumArtUrl": song.artwork?.url(width: 300, height: 300)?.absoluteString ?? "",
          "isrc": song.isrc ?? "",
          "previewUrl": song.previewAssets?.first?.url?.absoluteString ?? "",
        ]
      }
    }

    AsyncFunction("analyzeTrack") { (previewUrl: String) async throws -> [String: Any]? in
      guard let f = try await TempoAnalyzer.features(forPreviewURL: previewUrl) else { return nil }
      return [
        "bpm": f.bpm,
        "pulseClarity": f.pulseClarity,
        "tempoStability": f.tempoStability,
      ]
    }

    // SystemMusicPlayer wraps MPMusicPlayerController, whose state is
    // documented main-thread-only; Expo AsyncFunction closures run on a
    // background queue, so every player touch hops to the main actor.

    AsyncFunction("playTrack") { (trackId: String) async throws in
      let song = try await Self.fetchSong(trackId)
      await MainActor.run {
        self.lastEntryId = nil // a fresh queue may start on the same catalog id
        SystemMusicPlayer.shared.queue = [song]
      }
      try await SystemMusicPlayer.shared.play()
    }

    AsyncFunction("queueTrack") { (trackId: String) async throws in
      let song = try await Self.fetchSong(trackId)
      try await SystemMusicPlayer.shared.queue.insert(song, position: .tail)
    }

    AsyncFunction("pause") { () async in
      await MainActor.run { SystemMusicPlayer.shared.pause() }
    }

    AsyncFunction("resume") { () async throws in
      try await SystemMusicPlayer.shared.play()
    }

    AsyncFunction("playQueue") { (trackIds: [String]) async throws in
      let songs = try await Self.fetchSongs(trackIds)
      await MainActor.run {
        self.lastEntryId = nil // a fresh queue may start on the same catalog id
        SystemMusicPlayer.shared.queue = SystemMusicPlayer.Queue(for: songs)
      }
      try await SystemMusicPlayer.shared.play()
    }

    AsyncFunction("skipToNext") { () async throws in
      try await SystemMusicPlayer.shared.skipToNextEntry()
    }

    AsyncFunction("skipToPrevious") { () async throws in
      try await SystemMusicPlayer.shared.skipToPreviousEntry()
    }

    // Current playback position/length for the song progress bar (display only —
    // the system player can't be reliably seeked, so there's no scrub). Position
    // from the MusicKit player's playbackTime; duration from its current song.
    // Polled twice a second by JS, so main-thread access matters most here.
    AsyncFunction("getPlaybackStatus") { () async -> [String: Any?] in
      await MainActor.run {
        let player = SystemMusicPlayer.shared
        var duration: TimeInterval? = nil
        if case .song(let song)? = player.queue.currentEntry?.item {
          duration = song.duration
        }
        return [
          "position": player.playbackTime,
          "duration": duration,
          "isPlaying": player.state.playbackStatus == .playing,
        ]
      }
    }
  }

  // Observes the system player's queue so JS hears about track changes,
  // including natural auto-advance when a song ends on its own. The initial
  // emit on attach is what lets a resumed session realign to wherever the
  // player advanced while the app was dead — do not remove it.
  private func startObserving() {
    let player = SystemMusicPlayer.shared
    DispatchQueue.main.async { self.emitCurrentTrack(of: player) }

    player.queue.objectWillChange
      .receive(on: DispatchQueue.main)
      .sink { [weak self] _ in
        // objectWillChange fires before currentEntry settles; defer one tick.
        DispatchQueue.main.async {
          self?.emitCurrentTrack(of: player)
        }
      }
      .store(in: &cancellables)
  }

  private func emitCurrentTrack(of player: SystemMusicPlayer) {
    guard let entry = player.queue.currentEntry else { return }

    var trackId: String?
    var title: String?
    switch entry.item {
    case .song(let song)?:
      trackId = song.id.rawValue
      title = song.title
    case .musicVideo(let video)?:
      trackId = video.id.rawValue
      title = video.title
    default:
      // Entry id is a transient queue id, not the catalog id — skip if the
      // underlying item isn't resolved yet.
      title = entry.title
    }

    // Dedupe on the queue ENTRY (objectWillChange fires for many non-track
    // reasons), but emit the catalog id JS matches against. Entry-keyed dedupe
    // means consecutive repeats of the same song still emit.
    guard let id = trackId, entry.id != lastEntryId else { return }
    lastEntryId = entry.id
    sendEvent("onTrackChange", ["trackId": id, "title": title ?? ""])
  }

  // Fetches songs for the given IDs, preserving the requested order (the JS
  // layer hands them to us already sorted by how well they match the cadence).
  private static func fetchSongs(_ trackIds: [String]) async throws -> [Song] {
    let ids = trackIds.map { MusicItemID($0) }
    var request = MusicCatalogResourceRequest<Song>(matching: \.id, memberOf: ids)
    request.limit = ids.count
    let response = try await request.response()
    let byId = Dictionary(
      response.items.map { ($0.id.rawValue, $0) },
      uniquingKeysWith: { first, _ in first }
    )
    return trackIds.compactMap { byId[$0] }
  }

  private static func fetchSong(_ trackId: String) async throws -> Song {
    var request = MusicCatalogResourceRequest<Song>(matching: \.id, equalTo: MusicItemID(trackId))
    request.limit = 1
    let response = try await request.response()
    guard let song = response.items.first else {
      throw NSError(
        domain: "CadenceMusicKit",
        code: 404,
        userInfo: [NSLocalizedDescriptionKey: "Track not found"]
      )
    }
    return song
  }
}
