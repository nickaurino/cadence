import Foundation

// Accuracy harness for TempoAnalyzer. Compiled WITH the real
// modules/cadence-music-kit/ios/TempoAnalyzer.swift (see run.sh), so it
// exercises the exact production code. For each reference song it resolves the
// Apple Music preview URL from the public iTunes Search API, runs the analyzer,
// and classifies the detected BPM against a known reference:
//   exact  = within tolerance of the reference
//   octave = within tolerance of reference x2 or /2 (right song, wrong octave)
//   wrong  = neither (genuine miss)
// "octave" is the "feels half/double speed" case; "exact" is the true hit rate.

struct Fixture { let title: String; let artist: String; let refBpm: Double }

// Well-documented tempos across genres and a wide BPM spread. Reference BPMs are
// from public databases (songbpm / tunebat); they carry their own octave
// conventions, which is exactly why we score octave folds separately.
let fixtures: [Fixture] = [
  Fixture(title: "Blinding Lights", artist: "The Weeknd", refBpm: 171),
  Fixture(title: "Uptown Funk", artist: "Mark Ronson Bruno Mars", refBpm: 115),
  Fixture(title: "Levels", artist: "Avicii", refBpm: 126),
  Fixture(title: "HUMBLE", artist: "Kendrick Lamar", refBpm: 150),
  Fixture(title: "Shape of You", artist: "Ed Sheeran", refBpm: 96),
  Fixture(title: "Mr Brightside", artist: "The Killers", refBpm: 148),
  Fixture(title: "Bad Guy", artist: "Billie Eilish", refBpm: 135),
  Fixture(title: "Sunflower", artist: "Post Malone Swae Lee", refBpm: 90),
  Fixture(title: "Don't Start Now", artist: "Dua Lipa", refBpm: 124),
  Fixture(title: "Seven Nation Army", artist: "The White Stripes", refBpm: 124),
  Fixture(title: "Take On Me", artist: "a-ha", refBpm: 169),
  Fixture(title: "Get Lucky", artist: "Daft Punk", refBpm: 116),
  Fixture(title: "Smells Like Teen Spirit", artist: "Nirvana", refBpm: 117),
  Fixture(title: "Believer", artist: "Imagine Dragons", refBpm: 125),
  Fixture(title: "Thunderstruck", artist: "AC/DC", refBpm: 134),
  Fixture(title: "Industry Baby", artist: "Lil Nas X Jack Harlow", refBpm: 150),
]

struct Resolved { let previewUrl: String; let trackName: String; let artistName: String }

func resolvePreview(_ f: Fixture) async -> Resolved? {
  var comps = URLComponents(string: "https://itunes.apple.com/search")!
  comps.queryItems = [
    URLQueryItem(name: "term", value: "\(f.title) \(f.artist)"),
    URLQueryItem(name: "entity", value: "song"),
    URLQueryItem(name: "limit", value: "1"),
  ]
  guard let url = comps.url else { return nil }
  do {
    let (data, _) = try await URLSession.shared.data(from: url)
    let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
    guard let r = (json?["results"] as? [[String: Any]])?.first,
          let preview = r["previewUrl"] as? String else { return nil }
    return Resolved(
      previewUrl: preview,
      trackName: (r["trackName"] as? String) ?? "?",
      artistName: (r["artistName"] as? String) ?? "?"
    )
  } catch { return nil }
}

func classify(detected: Double, ref: Double) -> String {
  let tol = 0.05
  func near(_ a: Double, _ b: Double) -> Bool { abs(a - b) / b < tol }
  if near(detected, ref) { return "exact" }
  if near(detected, ref * 2) || near(detected, ref / 2) { return "octave" }
  return "wrong"
}

func pad(_ s: String, _ n: Int) -> String {
  s.count >= n ? String(s.prefix(n)) : s + String(repeating: " ", count: n - s.count)
}

func runAll() async {
  print(pad("SONG", 26) + pad("REF", 6) + pad("DETECTED", 10) + pad("CLASS", 9)
        + pad("CLARITY", 9) + pad("STABIL", 8) + "RESOLVED AS")
  print(String(repeating: "-", count: 110))

  var exact = 0, octave = 0, wrong = 0, failed = 0

  for f in fixtures {
    guard let r = await resolvePreview(f) else {
      print(pad(f.title, 26) + pad(String(Int(f.refBpm)), 6) + pad("no-preview", 10))
      failed += 1
      continue
    }
    let features = try? await TempoAnalyzer.features(forPreviewURL: r.previewUrl)
    guard let feat = features else {
      print(pad(f.title, 26) + pad(String(Int(f.refBpm)), 6) + pad("undetermined", 12))
      failed += 1
      continue
    }
    let cls = classify(detected: feat.bpm, ref: f.refBpm)
    switch cls {
    case "exact": exact += 1
    case "octave": octave += 1
    default: wrong += 1
    }
    let resolvedAs = "\(r.trackName) - \(r.artistName)"
    print(
      pad(f.title, 26)
      + pad(String(Int(f.refBpm)), 6)
      + pad(String(format: "%.1f", feat.bpm), 10)
      + pad(cls, 9)
      + pad(String(format: "%.2f", feat.pulseClarity), 9)
      + pad(String(format: "%.2f", feat.tempoStability), 8)
      + resolvedAs
    )
    try? await Task.sleep(nanoseconds: 200_000_000) // be polite to the iTunes API
  }

  let scored = exact + octave + wrong
  func pct(_ n: Int) -> String { scored == 0 ? "0%" : "\(Int(round(Double(n) / Double(scored) * 100)))%" }
  print(String(repeating: "-", count: 110))
  print("SUMMARY: \(scored) scored, \(failed) unresolved")
  print("  exact  \(exact) (\(pct(exact)))   <- true hit rate")
  print("  octave \(octave) (\(pct(octave)))   <- right song, half/double feel")
  print("  wrong  \(wrong) (\(pct(wrong)))")
}

let sema = DispatchSemaphore(value: 0)
Task { await runAll(); sema.signal() }
sema.wait()
