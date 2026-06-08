import AVFoundation
import Accelerate

// Estimates a song's tempo (BPM) from its 30-second Apple Music preview clip,
// which is a plain, non-DRM audio file. Pipeline: download -> decode to mono
// PCM -> spectral-flux onset envelope -> autocorrelation to find the beat
// period. Returns nil when the tempo can't be determined.
enum TempoAnalyzer {
  private enum AnalyzerError: Error { case decode }

  // Tempo search range. Songs outside this get folded in by the JS matcher's
  // half/double-time logic, so a tight range here keeps octave errors down.
  private static let minBpm = 60.0
  private static let maxBpm = 200.0

  static func bpm(forPreviewURL urlString: String) async throws -> Double? {
    guard let url = URL(string: urlString) else { return nil }

    let (data, _) = try await URLSession.shared.data(from: url)
    let tmp = FileManager.default.temporaryDirectory
      .appendingPathComponent(UUID().uuidString + ".m4a")
    try data.write(to: tmp)
    defer { try? FileManager.default.removeItem(at: tmp) }

    let (samples, sampleRate) = try monoSamples(from: tmp)
    return estimateTempo(samples: samples, sampleRate: sampleRate)
  }

  // Reads an audio file into a single mono Float channel.
  private static func monoSamples(from url: URL) throws -> ([Float], Double) {
    let file = try AVAudioFile(forReading: url)
    let format = file.processingFormat
    let frameCount = AVAudioFrameCount(file.length)
    guard frameCount > 0,
          let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else {
      throw AnalyzerError.decode
    }
    try file.read(into: buffer)

    let channels = Int(format.channelCount)
    let length = Int(buffer.frameLength)
    guard let floatData = buffer.floatChannelData, length > 0 else {
      throw AnalyzerError.decode
    }

    var mono = [Float](repeating: 0, count: length)
    for ch in 0..<channels {
      let ptr = floatData[ch]
      for i in 0..<length { mono[i] += ptr[i] }
    }
    if channels > 1 {
      var scale = 1.0 / Float(channels)
      vDSP_vsmul(mono, 1, &scale, &mono, 1, vDSP_Length(length))
    }
    return (mono, format.sampleRate)
  }

  private static func estimateTempo(samples: [Float], sampleRate: Double) -> Double? {
    let frameSize = 1024
    let hop = 512
    guard samples.count > frameSize * 8 else { return nil }

    let log2n = vDSP_Length(log2(Float(frameSize)))
    guard let fftSetup = vDSP_create_fftsetup(log2n, FFTRadix(kFFTRadix2)) else { return nil }
    defer { vDSP_destroy_fftsetup(fftSetup) }

    let halfN = frameSize / 2
    var window = [Float](repeating: 0, count: frameSize)
    vDSP_hann_window(&window, vDSP_Length(frameSize), Int32(vDSP_HANN_NORM))

    var realp = [Float](repeating: 0, count: halfN)
    var imagp = [Float](repeating: 0, count: halfN)
    var prevMag = [Float](repeating: 0, count: halfN)
    var flux: [Float] = []

    var pos = 0
    while pos + frameSize <= samples.count {
      var windowed = [Float](repeating: 0, count: frameSize)
      samples.withUnsafeBufferPointer { sp in
        vDSP_vmul(sp.baseAddress! + pos, 1, window, 1, &windowed, 1, vDSP_Length(frameSize))
      }

      var mag = [Float](repeating: 0, count: halfN)
      realp.withUnsafeMutableBufferPointer { rp in
        imagp.withUnsafeMutableBufferPointer { ip in
          var split = DSPSplitComplex(realp: rp.baseAddress!, imagp: ip.baseAddress!)
          windowed.withUnsafeBufferPointer { wp in
            wp.baseAddress!.withMemoryRebound(to: DSPComplex.self, capacity: halfN) { cp in
              vDSP_ctoz(cp, 2, &split, 1, vDSP_Length(halfN))
            }
          }
          vDSP_fft_zrip(fftSetup, &split, 1, log2n, FFTDirection(FFT_FORWARD))
          vDSP_zvabs(&split, 1, &mag, 1, vDSP_Length(halfN))
        }
      }

      // Spectral flux: sum of positive bin-to-bin magnitude increases. Peaks
      // line up with note/beat onsets.
      var sum: Float = 0
      for i in 0..<halfN {
        let delta = mag[i] - prevMag[i]
        if delta > 0 { sum += delta }
      }
      flux.append(sum)
      prevMag = mag
      pos += hop
    }

    guard flux.count > 16 else { return nil }

    // Remove the mean so steady energy doesn't swamp the autocorrelation.
    var mean: Float = 0
    vDSP_meanv(flux, 1, &mean, vDSP_Length(flux.count))
    var negMean = -mean
    vDSP_vsadd(flux, 1, &negMean, &flux, 1, vDSP_Length(flux.count))

    let frameRate = sampleRate / Double(hop)
    let minLag = max(1, Int((60.0 / maxBpm) * frameRate))
    let maxLag = min(flux.count - 1, Int((60.0 / minBpm) * frameRate))
    guard maxLag > minLag else { return nil }

    // The lag with the strongest self-similarity is the beat period.
    var bestLag = -1
    var bestCorr = -Float.greatestFiniteMagnitude
    for lag in minLag...maxLag {
      var corr: Float = 0
      flux.withUnsafeBufferPointer { fp in
        vDSP_dotpr(fp.baseAddress!, 1, fp.baseAddress! + lag, 1, &corr, vDSP_Length(flux.count - lag))
      }
      if corr > bestCorr {
        bestCorr = corr
        bestLag = lag
      }
    }
    guard bestLag > 0 else { return nil }

    let bpm = 60.0 * frameRate / Double(bestLag)
    return (bpm * 10).rounded() / 10
  }
}
