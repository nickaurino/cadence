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
  // Pop
  Fixture(title: "As It Was", artist: "Harry Styles", refBpm: 174),
  Fixture(title: "Watermelon Sugar", artist: "Harry Styles", refBpm: 95),
  Fixture(title: "good 4 u", artist: "Olivia Rodrigo", refBpm: 166),
  Fixture(title: "Flowers", artist: "Miley Cyrus", refBpm: 118),
  Fixture(title: "Anti-Hero", artist: "Taylor Swift", refBpm: 97),
  Fixture(title: "Shake It Off", artist: "Taylor Swift", refBpm: 160),
  Fixture(title: "Levitating", artist: "Dua Lipa", refBpm: 103),
  Fixture(title: "Roar", artist: "Katy Perry", refBpm: 90),
  Fixture(title: "Happy", artist: "Pharrell Williams", refBpm: 160),
  Fixture(title: "Can't Stop the Feeling", artist: "Justin Timberlake", refBpm: 113),
  Fixture(title: "Sugar", artist: "Maroon 5", refBpm: 120),
  // Hip-hop / R&B
  Fixture(title: "God's Plan", artist: "Drake", refBpm: 77),
  Fixture(title: "Mask Off", artist: "Future", refBpm: 75),
  Fixture(title: "Old Town Road", artist: "Lil Nas X", refBpm: 136),
  Fixture(title: "Nonstop", artist: "Drake", refBpm: 154),
  Fixture(title: "rockstar", artist: "Post Malone 21 Savage", refBpm: 160),
  Fixture(title: "Congratulations", artist: "Post Malone Quavo", refBpm: 123),
  Fixture(title: "Rolling in the Deep", artist: "Adele", refBpm: 105),
  Fixture(title: "Superstition", artist: "Stevie Wonder", refBpm: 100),
  // Rock
  Fixture(title: "Sweet Child O' Mine", artist: "Guns N' Roses", refBpm: 125),
  Fixture(title: "Billie Jean", artist: "Michael Jackson", refBpm: 117),
  Fixture(title: "Beat It", artist: "Michael Jackson", refBpm: 139),
  Fixture(title: "Back in Black", artist: "AC/DC", refBpm: 92),
  Fixture(title: "Every Breath You Take", artist: "The Police", refBpm: 117),
  Fixture(title: "Don't Stop Believin'", artist: "Journey", refBpm: 119),
  Fixture(title: "Africa", artist: "Toto", refBpm: 93),
  Fixture(title: "Wonderwall", artist: "Oasis", refBpm: 87),
  // Dance / EDM
  Fixture(title: "Wake Me Up", artist: "Avicii", refBpm: 124),
  Fixture(title: "Titanium", artist: "David Guetta Sia", refBpm: 126),
  Fixture(title: "Animals", artist: "Martin Garrix", refBpm: 128),
  Fixture(title: "Closer", artist: "The Chainsmokers Halsey", refBpm: 95),
  Fixture(title: "One More Time", artist: "Daft Punk", refBpm: 123),
  Fixture(title: "Clarity", artist: "Zedd Foxes", refBpm: 128),
  Fixture(title: "Wake Me Up Before You Go-Go", artist: "Wham!", refBpm: 161),
  // Classics / dance-floor
  Fixture(title: "Stayin' Alive", artist: "Bee Gees", refBpm: 104),
  Fixture(title: "Dancing Queen", artist: "ABBA", refBpm: 101),
  Fixture(title: "September", artist: "Earth Wind & Fire", refBpm: 126),
  Fixture(title: "I Wanna Dance with Somebody", artist: "Whitney Houston", refBpm: 119),
  Fixture(title: "Sweet Dreams", artist: "Eurythmics", refBpm: 126),
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
