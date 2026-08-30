import Cocoa
import WebKit

let brands: [(name: String, file: String, html: String)] = [
    (
        name: "Rolex",
        file: "images/markalar/rolex.png",
        html: """
        <!DOCTYPE html>
        <html>
        <head>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body {
            width:340px; height:240px; background:#EFEFEF;
            display:flex; flex-direction:column; align-items:center; justify-content:center;
            font-family:'Times New Roman', 'Baskerville', serif;
          }
          .crown { width:64px; height:46px; margin-bottom:10px; fill:#141416; }
          .title { font-size:29px; font-weight:800; letter-spacing:5px; color:#141416; text-transform:uppercase; font-family:'Garamond', 'Georgia', serif; }
        </style>
        </head>
        <body>
          <svg class="crown" viewBox="0 0 100 70">
            <!-- 5 balls -->
            <circle cx="10" cy="18" r="4.5"/>
            <circle cx="28" cy="8" r="4.8"/>
            <circle cx="50" cy="5" r="5.2"/>
            <circle cx="72" cy="8" r="4.8"/>
            <circle cx="90" cy="18" r="4.5"/>
            <!-- crown body -->
            <path d="M10 24 L24 48 L28 14 L42 48 L50 11 L58 48 L72 14 L76 48 L90 24 L84 56 C80 58 70 60 50 60 C30 60 20 58 16 56 Z" fill="#141416"/>
            <!-- crown base -->
            <ellipse cx="50" cy="62" rx="35" ry="4"/>
          </svg>
          <div class="title">ROLEX</div>
        </body>
        </html>
        """
    ),
    (
        name: "Cartier",
        file: "images/markalar/cartier.png",
        html: """
        <!DOCTYPE html>
        <html>
        <head>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body {
            width:340px; height:240px; background:#EFEFEF;
            display:flex; flex-direction:column; align-items:center; justify-content:center;
          }
          .title {
            font-family:'Baskerville', 'Times New Roman', 'Palatino', serif;
            font-size:42px;
            font-style:italic;
            font-weight:700;
            letter-spacing:1px;
            color:#141416;
          }
        </style>
        </head>
        <body>
          <div class="title">Cartier</div>
        </body>
        </html>
        """
    ),
    (
        name: "TAG Heuer",
        file: "images/markalar/tag-heuer.png",
        html: """
        <!DOCTYPE html>
        <html>
        <head>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body {
            width:340px; height:240px; background:#EFEFEF;
            display:flex; flex-direction:column; align-items:center; justify-content:center;
            font-family:'Helvetica Neue', Arial, sans-serif;
          }
          .shield {
            width:140px; height:68px;
            border:3px solid #141416;
            display:flex; flex-direction:column;
            position:relative;
          }
          .top-box {
            background:#141416; color:#EFEFEF;
            height:32px; display:flex; align-items:center; justify-content:center;
            font-weight:900; font-size:16px; letter-spacing:4px;
          }
          .bottom-box {
            background:#EFEFEF; color:#141416;
            height:32px; display:flex; align-items:center; justify-content:center;
            font-weight:900; font-size:14px; letter-spacing:3px;
          }
        </style>
        </head>
        <body>
          <svg width="140" height="74" viewBox="0 0 140 74">
            <!-- Outer Shield -->
            <polygon points="4,4 136,4 136,46 70,70 4,46" fill="#141416" stroke="#141416" stroke-width="2"/>
            <!-- Top Box -->
            <rect x="7" y="7" width="126" height="28" fill="#141416"/>
            <text x="70" y="27" font-family="'Helvetica Neue', Arial, sans-serif" font-size="16" font-weight="900" letter-spacing="4" fill="#FFFFFF" text-anchor="middle">TAG</text>
            <!-- Divider -->
            <line x1="7" y1="36" x2="133" y2="36" stroke="#EFEFEF" stroke-width="2"/>
            <!-- Bottom Box -->
            <polygon points="7,38 133,38 133,45 70,67 7,45" fill="#EFEFEF"/>
            <text x="70" y="55" font-family="'Helvetica Neue', Arial, sans-serif" font-size="13" font-weight="900" letter-spacing="2.5" fill="#141416" text-anchor="middle">HEUER</text>
          </svg>
        </body>
        </html>
        """
    ),
    (
        name: "Vacheron Constantin",
        file: "images/markalar/vacheron-constantin.png",
        html: """
        <!DOCTYPE html>
        <html>
        <head>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body {
            width:340px; height:240px; background:#EFEFEF;
            display:flex; flex-direction:column; align-items:center; justify-content:center;
            font-family:'Garamond', 'Georgia', serif;
            text-align:center;
          }
          .cross { width:32px; height:32px; fill:#141416; margin-bottom:8px; }
          .title { font-size:16px; font-weight:800; letter-spacing:2px; color:#141416; text-transform:uppercase; line-height:1.2; }
          .subtitle { font-size:10px; font-weight:600; letter-spacing:3px; color:#555; text-transform:uppercase; margin-top:4px; }
        </style>
        </head>
        <body>
          <!-- Maltese Cross -->
          <svg class="cross" viewBox="0 0 100 100">
            <polygon points="50,50 30,10 50,22 70,10" fill="#141416"/>
            <polygon points="50,50 90,30 78,50 90,70" fill="#141416"/>
            <polygon points="50,50 70,90 50,78 30,90" fill="#141416"/>
            <polygon points="50,50 10,70 22,50 10,30" fill="#141416"/>
          </svg>
          <div class="title">VACHERON CONSTANTIN</div>
          <div class="subtitle">GENÈVE</div>
        </body>
        </html>
        """
    ),
    (
        name: "Longines",
        file: "images/markalar/longines.png",
        html: """
        <!DOCTYPE html>
        <html>
        <head>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body {
            width:340px; height:240px; background:#EFEFEF;
            display:flex; flex-direction:column; align-items:center; justify-content:center;
            font-family:'Baskerville', 'Times New Roman', serif;
          }
          .wings { width:74px; height:26px; fill:#141416; margin-bottom:8px; }
          .title { font-size:24px; font-weight:800; letter-spacing:4px; color:#141416; text-transform:uppercase; }
        </style>
        </head>
        <body>
          <!-- Winged Hourglass -->
          <svg class="wings" viewBox="0 0 120 40">
            <!-- Left Wing -->
            <path d="M42 20 C32 10, 15 8, 2 12 C14 20, 28 26, 42 24 Z" fill="#141416"/>
            <path d="M42 16 C30 6, 12 4, 0 8 C12 14, 26 20, 40 20 Z" fill="#141416"/>
            <!-- Right Wing -->
            <path d="M78 20 C88 10, 105 8, 118 12 C106 20, 92 26, 78 24 Z" fill="#141416"/>
            <path d="M78 16 C90 6, 108 4, 120 8 C108 14, 94 20, 80 20 Z" fill="#141416"/>
            <!-- Center Hourglass -->
            <polygon points="50,10 70,10 50,30 70,30" fill="#141416"/>
            <rect x="48" y="8" width="24" height="3" fill="#141416"/>
            <rect x="48" y="29" width="24" height="3" fill="#141416"/>
          </svg>
          <div class="title">LONGINES</div>
        </body>
        </html>
        """
    ),
    (
        name: "Rado",
        file: "images/markalar/rado.png",
        html: """
        <!DOCTYPE html>
        <html>
        <head>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body {
            width:340px; height:240px; background:#EFEFEF;
            display:flex; flex-direction:column; align-items:center; justify-content:center;
            font-family:'Helvetica Neue', Arial, sans-serif;
          }
          .anchor { width:28px; height:28px; fill:#141416; margin-bottom:8px; }
          .title { font-size:30px; font-weight:800; letter-spacing:6px; color:#141416; text-transform:uppercase; }
          .subtitle { font-size:9.5px; font-weight:700; letter-spacing:3px; color:#666; text-transform:uppercase; margin-top:4px; }
        </style>
        </head>
        <body>
          <!-- Rado Anchor -->
          <svg class="anchor" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#141416" stroke-width="6"/>
            <!-- Anchor symbol -->
            <path d="M50 25 L50 72 M34 56 C38 72, 62 72, 66 56 M30 38 L70 38" stroke="#141416" stroke-width="6" stroke-linecap="round" fill="none"/>
            <circle cx="50" cy="25" r="5" fill="#141416"/>
          </svg>
          <div class="title">RADO</div>
          <div class="subtitle">SWITZERLAND</div>
        </body>
        </html>
        """
    )
]

let app = NSApplication.shared

class BatchRenderer: NSObject, WKNavigationDelegate {
    var webView: WKWebView!
    var index = 0
    
    func start() {
        let config = WKWebViewConfiguration()
        webView = WKWebView(frame: CGRect(x: 0, y: 0, width: 340, height: 240), configuration: config)
        webView.navigationDelegate = self
        renderNext()
    }
    
    func renderNext() {
        guard index < brands.count else {
            print("All 6 luxury logos generated successfully!")
            exit(0)
        }
        let item = brands[index]
        print("Rendering \(item.name)...")
        webView.loadHTMLString(item.html, baseURL: nil)
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Allow layout to settle
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
            let snapConfig = WKSnapshotConfiguration()
            snapConfig.rect = CGRect(x: 0, y: 0, width: 340, height: 240)
            self.webView.takeSnapshot(with: snapConfig) { image, error in
                if let img = image,
                   let cgImg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) {
                    let rep = NSBitmapImageRep(cgImage: cgImg)
                    if let pngData = rep.representation(using: .png, properties: [:]) {
                        let path = brands[self.index].file
                        try? pngData.write(to: URL(fileURLWithPath: path))
                        print("Saved \(path)")
                    }
                }
                self.index += 1
                self.renderNext()
            }
        }
    }
}

let renderer = BatchRenderer()
renderer.start()
app.run()
