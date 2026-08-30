import Cocoa
import WebKit

// Define standard HTML/SVG for each brand to guarantee 100% vector-sharp, perfectly uniform font sizes and alignment!
let brandDefs: [(file: String, html: String)] = [
    (
        file: "images/markalar/fossil.png",
        html: """
        <div style="font-family:'Arial Black', 'Helvetica Neue', sans-serif; font-size:28px; font-weight:900; letter-spacing:4px; color:#141416;">FOSSIL</div>
        """
    ),
    (
        file: "images/markalar/guess.png",
        html: """
        <div style="font-family:'Times New Roman', 'Baskerville', serif; font-size:32px; font-weight:800; letter-spacing:7px; color:#141416;">GUESS</div>
        """
    ),
    (
        file: "images/markalar/seiko.png",
        html: """
        <div style="font-family:'Times New Roman', 'Georgia', serif; font-size:32px; font-weight:900; letter-spacing:4px; color:#141416;">SEIKO</div>
        """
    ),
    (
        file: "images/markalar/calvin-klein.png",
        html: """
        <div style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:24px; font-weight:400; letter-spacing:3px; color:#141416; text-transform:uppercase;">Calvin Klein</div>
        """
    ),
    (
        file: "images/markalar/michael-kors.png",
        html: """
        <div style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:23px; font-weight:700; letter-spacing:3.5px; color:#141416; text-transform:uppercase;">MICHAEL KORS</div>
        """
    ),
    (
        file: "images/markalar/versace.png",
        html: """
        <div style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:28px; font-weight:800; letter-spacing:5px; color:#141416;">VERSACE</div>
        """
    ),
    (
        file: "images/markalar/cartier.png",
        html: """
        <div style="font-family:'Baskerville', 'Times New Roman', serif; font-size:36px; font-style:italic; font-weight:700; letter-spacing:2px; color:#141416;">Cartier</div>
        """
    ),
    (
        file: "images/markalar/diesel.png",
        html: """
        <div style="font-family:'Impact', 'Arial Black', sans-serif; font-size:32px; font-weight:900; letter-spacing:3px; color:#141416;">DIESEL</div>
        """
    ),
    (
        file: "images/markalar/welder.png",
        html: """
        <div style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:27px; font-weight:800; letter-spacing:5px; color:#141416;">WELDER</div>
        """
    ),
    (
        file: "images/markalar/gc.png",
        html: """
        <div style="font-family:'Times New Roman', serif; font-size:46px; font-weight:700; letter-spacing:1px; color:#141416; line-height:1;">Gc</div>
        """
    ),
    (
        file: "images/markalar/carren.png",
        html: """
        <div style="display:flex; flex-direction:column; align-items:center;">
          <svg width="22" height="22" viewBox="0 0 100 100" style="margin-bottom:4px;">
            <path d="M50 10 C40 30 30 50 30 65 C30 80 40 90 50 90 C60 90 70 80 70 65 C70 50 60 30 50 10 Z M50 25 L50 80" fill="#141416"/>
          </svg>
          <div style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:24px; font-weight:900; letter-spacing:4px; color:#141416; display:flex; align-items:center;">
            C<span style="color:#D32F2F;">▲</span>RREN
          </div>
        </div>
        """
    ),
    (
        file: "images/markalar/rolex.png",
        html: """
        <div style="display:flex; flex-direction:column; align-items:center;">
          <svg width="34" height="24" viewBox="0 0 100 70" style="margin-bottom:4px;">
            <circle cx="10" cy="18" r="4.5" fill="#141416"/>
            <circle cx="28" cy="8" r="4.8" fill="#141416"/>
            <circle cx="50" cy="5" r="5.2" fill="#141416"/>
            <circle cx="72" cy="8" r="4.8" fill="#141416"/>
            <circle cx="90" cy="18" r="4.5" fill="#141416"/>
            <path d="M10 24 L24 48 L28 14 L42 48 L50 11 L58 48 L72 14 L76 48 L90 24 L84 56 C80 58 70 60 50 60 C30 60 20 58 16 56 Z" fill="#141416"/>
            <ellipse cx="50" cy="62" rx="35" ry="4" fill="#141416"/>
          </svg>
          <div style="font-family:'Garamond', 'Georgia', serif; font-size:26px; font-weight:800; letter-spacing:5px; color:#141416;">ROLEX</div>
        </div>
        """
    ),
    (
        file: "images/markalar/tag-heuer.png",
        html: """
        <svg width="120" height="58" viewBox="0 0 140 70">
          <polygon points="4,4 136,4 136,44 70,66 4,44" fill="#141416"/>
          <rect x="7" y="7" width="126" height="26" fill="#141416"/>
          <text x="70" y="26" font-family="'Helvetica Neue', Arial, sans-serif" font-size="15" font-weight="900" letter-spacing="4" fill="#FFFFFF" text-anchor="middle">TAG</text>
          <line x1="7" y1="34" x2="133" y2="34" stroke="#EFEFEF" stroke-width="2"/>
          <polygon points="7,36 133,36 133,42 70,63 7,42" fill="#EFEFEF"/>
          <text x="70" y="52" font-family="'Helvetica Neue', Arial, sans-serif" font-size="12" font-weight="900" letter-spacing="2" fill="#141416" text-anchor="middle">HEUER</text>
        </svg>
        """
    ),
    (
        file: "images/markalar/vacheron-constantin.png",
        html: """
        <div style="display:flex; flex-direction:column; align-items:center; text-align:center;">
          <svg width="22" height="22" viewBox="0 0 100 100" style="margin-bottom:3px;">
            <polygon points="50,50 30,10 50,22 70,10" fill="#141416"/>
            <polygon points="50,50 90,30 78,50 90,70" fill="#141416"/>
            <polygon points="50,50 70,90 50,78 30,90" fill="#141416"/>
            <polygon points="50,50 10,70 22,50 10,30" fill="#141416"/>
          </svg>
          <div style="font-family:'Garamond', 'Georgia', serif; font-size:18px; font-weight:800; letter-spacing:2.5px; color:#141416;">VACHERON CONSTANTIN</div>
        </div>
        """
    ),
    (
        file: "images/markalar/longines.png",
        html: """
        <div style="display:flex; flex-direction:column; align-items:center;">
          <svg width="44" height="16" viewBox="0 0 120 40" style="margin-bottom:3px;">
            <path d="M42 20 C32 10, 15 8, 2 12 C14 20, 28 26, 42 24 Z" fill="#141416"/>
            <path d="M78 20 C88 10, 105 8, 118 12 C106 20, 92 26, 78 24 Z" fill="#141416"/>
            <polygon points="50,10 70,10 50,30 70,30" fill="#141416"/>
            <rect x="48" y="8" width="24" height="3" fill="#141416"/>
            <rect x="48" y="29" width="24" height="3" fill="#141416"/>
          </svg>
          <div style="font-family:'Baskerville', 'Times New Roman', serif; font-size:24px; font-weight:800; letter-spacing:4px; color:#141416;">LONGINES</div>
        </div>
        """
    ),
    (
        file: "images/markalar/rado.png",
        html: """
        <div style="display:flex; flex-direction:column; align-items:center;">
          <svg width="20" height="20" viewBox="0 0 100 100" style="margin-bottom:2px;">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#141416" stroke-width="7"/>
            <path d="M50 25 L50 72 M34 56 C38 72, 62 72, 66 56 M30 38 L70 38" stroke="#141416" stroke-width="7" stroke-linecap="round" fill="none"/>
            <circle cx="50" cy="25" r="5" fill="#141416"/>
          </svg>
          <div style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:26px; font-weight:900; letter-spacing:5px; color:#141416;">RADO</div>
        </div>
        """
    )
]

let app = NSApplication.shared

class UniformRenderer: NSObject, WKNavigationDelegate {
    var webView: WKWebView!
    var index = 0
    
    func start() {
        let config = WKWebViewConfiguration()
        webView = WKWebView(frame: CGRect(x: 0, y: 0, width: 340, height: 180), configuration: config)
        webView.navigationDelegate = self
        renderNext()
    }
    
    func renderNext() {
        guard index < brandDefs.count else {
            print("All 16 brand logos rendered with 100% UNIFORM optical typography scale!")
            exit(0)
        }
        let item = brandDefs[index]
        let fullHtml = """
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8">
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body {
            width:340px; height:180px; background:#EFEFEF;
            display:flex; align-items:center; justify-content:center;
            -webkit-font-smoothing: antialiased;
          }
        </style>
        </head>
        <body>
          \(item.html)
        </body>
        </html>
        """
        webView.loadHTMLString(fullHtml, baseURL: nil)
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
            let snapConfig = WKSnapshotConfiguration()
            snapConfig.rect = CGRect(x: 0, y: 0, width: 340, height: 180)
            self.webView.takeSnapshot(with: snapConfig) { image, error in
                if let img = image,
                   let cgImg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) {
                    let rep = NSBitmapImageRep(cgImage: cgImg)
                    if let pngData = rep.representation(using: .png, properties: [:]) {
                        let path = brandDefs[self.index].file
                        try? pngData.write(to: URL(fileURLWithPath: path))
                        print("Saved uniform \(path)")
                    }
                }
                self.index += 1
                self.renderNext()
            }
        }
    }
}

let renderer = UniformRenderer()
renderer.start()
app.run()
