import Cocoa
import WebKit

let brands: [(file: String, html: String)] = [
    (
        file: "images/markalar/fossil.png",
        html: """
        <div style="font-family:'Arial Black', 'Helvetica Neue', 'Impact', sans-serif; font-size:42px; font-weight:900; letter-spacing:5px; color:#000000;">
          FOSSIL
        </div>
        """
    ),
    (
        file: "images/markalar/guess.png",
        html: """
        <div style="font-family:'Georgia', 'Times New Roman', serif; font-size:44px; font-weight:900; letter-spacing:8px; color:#000000;">
          GUESS
        </div>
        """
    ),
    (
        file: "images/markalar/seiko.png",
        html: """
        <div style="font-family:'Georgia', 'Times New Roman', serif; font-size:46px; font-weight:900; letter-spacing:5px; color:#000000;">
          SEIKO
        </div>
        """
    ),
    (
        file: "images/markalar/michael-kors.png",
        html: """
        <div style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:32px; font-weight:900; letter-spacing:4.5px; color:#000000; text-transform:uppercase;">
          MICHAEL KORS
        </div>
        """
    ),
    (
        file: "images/markalar/calvin-klein.png",
        html: """
        <div style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:32px; font-weight:800; letter-spacing:4px; color:#000000; text-transform:uppercase;">
          CALVIN KLEIN
        </div>
        """
    ),
    (
        file: "images/markalar/versace.png",
        html: """
        <div style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:38px; font-weight:900; letter-spacing:6px; color:#000000; text-transform:uppercase;">
          VERSACE
        </div>
        """
    ),
    (
        file: "images/markalar/cartier.png",
        html: """
        <div style="font-family:'Baskerville', 'Times New Roman', 'Georgia', serif; font-size:52px; font-style:italic; font-weight:900; letter-spacing:2px; color:#000000;">
          Cartier
        </div>
        """
    ),
    (
        file: "images/markalar/diesel.png",
        html: """
        <div style="display:flex; flex-direction:column; align-items:center;">
          <div style="font-family:'Impact', 'Arial Black', sans-serif; font-size:46px; font-weight:900; letter-spacing:4px; color:#000000; line-height:1;">
            DIESEL
          </div>
          <div style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:10px; font-weight:900; letter-spacing:3px; color:#333333; margin-top:4px;">
            FOR SUCCESSFUL LIVING
          </div>
        </div>
        """
    ),
    (
        file: "images/markalar/welder.png",
        html: """
        <div style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:38px; font-weight:900; letter-spacing:6px; color:#000000; text-transform:uppercase;">
          WELDER
        </div>
        """
    ),
    (
        file: "images/markalar/gc.png",
        html: """
        <div style="font-family:'Georgia', 'Times New Roman', serif; font-size:62px; font-weight:900; letter-spacing:1px; color:#000000; line-height:1;">
          Gc
        </div>
        """
    ),
    (
        file: "images/markalar/carren.png",
        html: """
        <div style="display:flex; flex-direction:column; align-items:center;">
          <svg width="30" height="30" viewBox="0 0 100 100" style="margin-bottom:6px;">
            <path d="M50 10 C38 32 26 54 26 70 C26 86 37 94 50 94 C63 94 74 86 74 70 C74 54 62 32 50 10 Z M50 25 L50 82" fill="#000000"/>
          </svg>
          <div style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:34px; font-weight:900; letter-spacing:5px; color:#000000; display:flex; align-items:center;">
            C<span style="color:#D32F2F; margin:0 1px;">▲</span>RREN
          </div>
        </div>
        """
    ),
    (
        file: "images/markalar/rolex.png",
        html: """
        <div style="display:flex; flex-direction:column; align-items:center;">
          <svg width="44" height="30" viewBox="0 0 100 70" style="margin-bottom:6px;">
            <circle cx="10" cy="18" r="5" fill="#000000"/>
            <circle cx="28" cy="8" r="5.5" fill="#000000"/>
            <circle cx="50" cy="4" r="6" fill="#000000"/>
            <circle cx="72" cy="8" r="5.5" fill="#000000"/>
            <circle cx="90" cy="18" r="5" fill="#000000"/>
            <path d="M10 24 L24 48 L28 14 L42 48 L50 10 L58 48 L72 14 L76 48 L90 24 L84 56 C80 58 70 60 50 60 C30 60 20 58 16 56 Z" fill="#000000"/>
            <ellipse cx="50" cy="63" rx="36" ry="5" fill="#000000"/>
          </svg>
          <div style="font-family:'Georgia', 'Times New Roman', serif; font-size:36px; font-weight:900; letter-spacing:6px; color:#000000;">
            ROLEX
          </div>
        </div>
        """
    ),
    (
        file: "images/markalar/tag-heuer.png",
        html: """
        <svg width="150" height="74" viewBox="0 0 150 74">
          <polygon points="4,4 146,4 146,46 75,70 4,46" fill="#000000"/>
          <rect x="8" y="8" width="134" height="28" fill="#000000"/>
          <text x="75" y="30" font-family="'Helvetica Neue', Arial, sans-serif" font-size="20" font-weight="900" letter-spacing="5" fill="#FFFFFF" text-anchor="middle">TAG</text>
          <line x1="8" y1="38" x2="142" y2="38" stroke="#F4F4F4" stroke-width="2.5"/>
          <polygon points="8,40 142,40 142,44 75,67 8,44" fill="#F4F4F4"/>
          <text x="75" y="58" font-family="'Helvetica Neue', Arial, sans-serif" font-size="16" font-weight="900" letter-spacing="3" fill="#000000" text-anchor="middle">HEUER</text>
        </svg>
        """
    ),
    (
        file: "images/markalar/vacheron-constantin.png",
        html: """
        <div style="display:flex; flex-direction:column; align-items:center; text-align:center;">
          <svg width="28" height="28" viewBox="0 0 100 100" style="margin-bottom:5px;">
            <polygon points="50,50 30,10 50,22 70,10" fill="#000000"/>
            <polygon points="50,50 90,30 78,50 90,70" fill="#000000"/>
            <polygon points="50,50 70,90 50,78 30,90" fill="#000000"/>
            <polygon points="50,50 10,70 22,50 10,30" fill="#000000"/>
          </svg>
          <div style="font-family:'Georgia', 'Times New Roman', serif; font-size:24px; font-weight:900; letter-spacing:3px; color:#000000; line-height:1.2;">
            VACHERON CONSTANTIN
          </div>
          <div style="font-family:'Georgia', serif; font-size:12px; font-weight:700; letter-spacing:4px; color:#444444; margin-top:2px;">
            GENÈVE
          </div>
        </div>
        """
    ),
    (
        file: "images/markalar/longines.png",
        html: """
        <div style="display:flex; flex-direction:column; align-items:center;">
          <svg width="56" height="20" viewBox="0 0 120 40" style="margin-bottom:5px;">
            <path d="M42 20 C32 10, 15 8, 2 12 C14 20, 28 26, 42 24 Z" fill="#000000"/>
            <path d="M78 20 C88 10, 105 8, 118 12 C106 20, 92 26, 78 24 Z" fill="#000000"/>
            <polygon points="50,10 70,10 50,30 70,30" fill="#000000"/>
            <rect x="48" y="8" width="24" height="3" fill="#000000"/>
            <rect x="48" y="29" width="24" height="3" fill="#000000"/>
          </svg>
          <div style="font-family:'Georgia', 'Times New Roman', serif; font-size:36px; font-weight:900; letter-spacing:5px; color:#000000;">
            LONGINES
          </div>
        </div>
        """
    ),
    (
        file: "images/markalar/rado.png",
        html: """
        <div style="display:flex; flex-direction:column; align-items:center;">
          <svg width="26" height="26" viewBox="0 0 100 100" style="margin-bottom:4px;">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#000000" stroke-width="8"/>
            <path d="M50 25 L50 72 M34 56 C38 72, 62 72, 66 56 M30 38 L70 38" stroke="#000000" stroke-width="8" stroke-linecap="round" fill="none"/>
            <circle cx="50" cy="25" r="6" fill="#000000"/>
          </svg>
          <div style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:36px; font-weight:900; letter-spacing:6px; color:#000000;">
            RADO
          </div>
          <div style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:11px; font-weight:900; letter-spacing:4px; color:#444444; margin-top:2px;">
            SWITZERLAND
          </div>
        </div>
        """
    )
]

let app = NSApplication.shared

class HighContrastRenderer: NSObject, WKNavigationDelegate {
    var webView: WKWebView!
    var index = 0
    
    func start() {
        let config = WKWebViewConfiguration()
        webView = WKWebView(frame: CGRect(x: 0, y: 0, width: 360, height: 180), configuration: config)
        webView.navigationDelegate = self
        renderNext()
    }
    
    func renderNext() {
        guard index < brands.count else {
            print("All 16 brand logos rendered in bold, pitch-black high contrast!")
            exit(0)
        }
        let item = brands[index]
        let fullHtml = """
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8">
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body {
            width:360px; height:180px; background:#F4F4F4;
            display:flex; align-items:center; justify-content:center;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
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
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) {
            let snapConfig = WKSnapshotConfiguration()
            snapConfig.rect = CGRect(x: 0, y: 0, width: 360, height: 180)
            self.webView.takeSnapshot(with: snapConfig) { image, error in
                if let img = image,
                   let cgImg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) {
                    let rep = NSBitmapImageRep(cgImage: cgImg)
                    if let pngData = rep.representation(using: .png, properties: [:]) {
                        let path = brands[self.index].file
                        try? pngData.write(to: URL(fileURLWithPath: path))
                        print("Saved high-contrast bold \(path)")
                    }
                }
                self.index += 1
                self.renderNext()
            }
        }
    }
}

let renderer = HighContrastRenderer()
renderer.start()
app.run()
