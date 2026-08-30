import Cocoa

let dir = "images/markalar"
let files = [
  "fossil.png", "guess.png", "gc.png", "seiko.png", "calvin-klein.png",
  "michael-kors.png", "diesel.png", "welder.png", "versace.png", "carren.png",
  "rolex.png", "cartier.png", "tag-heuer.png", "vacheron-constantin.png", "longines.png", "rado.png"
]

let targetCanvasW: CGFloat = 340.0
let targetCanvasH: CGFloat = 180.0

for file in files {
    let path = "\(dir)/\(file)"
    guard let img = NSImage(contentsOfFile: path),
          let cgImg = img.cgImage(forProposedRect: nil, context: nil, hints: nil),
          let data = cgImg.dataProvider?.data,
          let ptr = CFDataGetBytePtr(data) else { continue }
    
    let w = cgImg.width
    let h = cgImg.height
    let bpr = cgImg.bytesPerRow
    let bpp = cgImg.bitsPerPixel / 8
    
    var minX = w, maxX = 0, minY = h, maxY = 0
    
    for y in 0..<h {
        for x in 0..<w {
            let offset = y * bpr + x * bpp
            let r = Int(ptr[offset])
            let g = Int(ptr[offset+1])
            let b = Int(ptr[offset+2])
            let a = bpp == 4 ? Int(ptr[offset+3]) : 255
            
            // Check if non-background
            if a > 30 && (abs(r - 239) > 12 || abs(g - 239) > 12 || abs(b - 239) > 12) {
                if x < minX { minX = x }
                if x > maxX { maxX = x }
                if y < minY { minY = y }
                if y > maxY { maxY = y }
            }
        }
    }
    
    guard maxX >= minX, maxY >= minY else {
        print("Empty logo: \(file)")
        continue
    }
    
    let cropRect = CGRect(x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1)
    guard let croppedCg = cgImg.cropping(to: cropRect) else { continue }
    
    let cropW = CGFloat(cropRect.width)
    let cropH = CGFloat(cropRect.height)
    let aspect = cropW / cropH
    
    // Determine target size for optical harmonization
    var drawW: CGFloat = 0
    var drawH: CGFloat = 0
    
    if aspect > 3.2 {
        // Wide text logo (e.g. Fossil, Guess, Seiko, Calvin Klein, Michael Kors, Cartier, Versace)
        drawH = 30.0
        drawW = drawH * aspect
        if drawW > 200.0 {
            drawW = 200.0
            drawH = drawW / aspect
        }
    } else if aspect > 2.0 {
        // Moderately wide logo (e.g. Longines, TAG Heuer, Vacheron Constantin)
        drawH = 46.0
        drawW = drawH * aspect
        if drawW > 210.0 {
            drawW = 210.0
            drawH = drawW / aspect
        }
    } else {
        // Stacked / emblem logo (e.g. Rolex, Rado, Gc, Carren, Diesel, Welder)
        drawH = 54.0
        drawW = drawH * aspect
        if drawW > 180.0 {
            drawW = 180.0
            drawH = drawW / aspect
        }
    }
    
    // Create new standardized canvas
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let ctx = CGContext(data: nil,
                              width: Int(targetCanvasW),
                              height: Int(targetCanvasH),
                              bitsPerComponent: 8,
                              bytesPerRow: Int(targetCanvasW) * 4,
                              space: colorSpace,
                              bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { continue }
    
    // Background #EFEFEF
    ctx.setFillColor(CGColor(red: 239/255.0, green: 239/255.0, blue: 239/255.0, alpha: 1.0))
    ctx.fill(CGRect(x: 0, y: 0, width: targetCanvasW, height: targetCanvasH))
    
    // Center cropped logo
    let drawX = (targetCanvasW - drawW) / 2.0
    let drawY = (targetCanvasH - drawH) / 2.0
    
    ctx.interpolationQuality = .high
    ctx.draw(croppedCg, in: CGRect(x: drawX, y: drawY, width: drawW, height: drawH))
    
    guard let resultCg = ctx.makeImage() else { continue }
    let rep = NSBitmapImageRep(cgImage: resultCg)
    if let png = rep.representation(using: .png, properties: [:]) {
        try? png.write(to: URL(fileURLWithPath: path))
        print("Normalized \(file): drawn \(Int(drawW))x\(Int(drawH)) on \(Int(targetCanvasW))x\(Int(targetCanvasH))")
    }
}
print("All 16 logos standardized successfully!")
