(ns metabase.channel.render.png
  "Logic for rendering HTML to a PNG.

  Ported by @tlrobinson from
  https://github.com/radkovo/CSSBox/blob/cssbox-4.10/src/main/java/org/fit/cssbox/demo/ImageRenderer.java with
  subsequent code simplification and cleanup by @camsaul

  CSSBox JavaDoc is here: http://cssbox.sourceforge.net/api/index.html"
  (:require
   [clojure.walk :as walk]
   [hiccup.core :refer [html]]
   [metabase.channel.render.body :as body]
   [metabase.channel.render.style :as style]
   [metabase.util.log :as log]
   [metabase.util.malli :as mu])
  (:import
   (cz.vutbr.web.css MediaSpec)
   (java.awt Font GraphicsEnvironment Graphics2D RenderingHints)
   (java.awt.image BufferedImage)
   (java.io ByteArrayInputStream ByteArrayOutputStream)
   (java.nio.charset StandardCharsets)
   (javax.imageio ImageIO)
   (org.fit.cssbox.awt GraphicsEngine)
   (org.fit.cssbox.css CSSNorm DOMAnalyzer DOMAnalyzer$Origin)
   (org.fit.cssbox.io DefaultDOMSource StreamDocumentSource)
   (org.fit.cssbox.layout Dimension)
   (org.w3c.dom Document)))

(set! *warn-on-reflection* true)

(defn- write-image!
  [^BufferedImage image, ^String format-name, ^ByteArrayOutputStream output-stream]
  (ImageIO/write image format-name output-stream))

(defn- dom-analyzer
  ^DOMAnalyzer [^Document doc, ^StreamDocumentSource doc-source, ^Dimension window-size]
  (doto (DOMAnalyzer. doc (.getURL doc-source))
    (.setMediaSpec (doto (MediaSpec. "screen")
                     (.setDimensions       (.width window-size) (.height window-size))
                     (.setDeviceDimensions (.width window-size) (.height window-size))))
    .attributesToStyles
    (.addStyleSheet nil (CSSNorm/stdStyleSheet)   DOMAnalyzer$Origin/AGENT)
    (.addStyleSheet nil (CSSNorm/userStyleSheet)  DOMAnalyzer$Origin/AGENT)
    (.addStyleSheet nil (CSSNorm/formsStyleSheet) DOMAnalyzer$Origin/AGENT)
    .getStyleSheets))

(defn- render-to-png
  ^java.awt.image.BufferedImage [^String html width]
  (style/register-fonts-if-needed!)
  (with-open [is         (ByteArrayInputStream. (.getBytes html StandardCharsets/UTF_8))
              doc-source (StreamDocumentSource. is nil "text/html; charset=utf-8")]
    (let [dimension       (Dimension. width 1)
          doc             (.parse (DefaultDOMSource. doc-source))
          da              (dom-analyzer doc doc-source dimension)
          graphics-engine (proxy [GraphicsEngine] [(.getRoot da) da (.getURL doc-source)]
                            (setupGraphics [^Graphics2D g]
                              (doto g
                                (.setRenderingHint RenderingHints/KEY_RENDERING
                                                   RenderingHints/VALUE_RENDER_QUALITY)
                                (.setRenderingHint RenderingHints/KEY_ALPHA_INTERPOLATION
                                                   RenderingHints/VALUE_ALPHA_INTERPOLATION_QUALITY)
                                (.setRenderingHint RenderingHints/KEY_TEXT_ANTIALIASING
                                                   RenderingHints/VALUE_TEXT_ANTIALIAS_GASP)
                                (.setRenderingHint RenderingHints/KEY_FRACTIONALMETRICS
                                                   RenderingHints/VALUE_FRACTIONALMETRICS_ON))))]
      (.createLayout graphics-engine dimension)
      (let [image         (.getImage graphics-engine)
            viewport      (.getViewport graphics-engine)
            ;; CSSBox voodoo -- sometimes maximal width < minimal width, no idea why
            content-width (max (int (.getMinimalWidth viewport))
                               (int (.getMaximalWidth viewport)))]
        ;; Crop the image to the actual size of the rendered content so that tables don't have a ton of whitespace.
        (if (< content-width (.getWidth image))
          (.getSubimage image 0 0 content-width (.getHeight image))
          image)))))

(defn- font-can-fully-render?
  [^Font font s]
  (neg? (.canDisplayUpTo font s)))

(def ^:private get-lato
  (letfn [(get-lato* []
            (let [lato-names #{"Lato Regular" "Lato-Regular" "lato" "lato-regular"}
                  env        (GraphicsEnvironment/getLocalGraphicsEnvironment)
                  fonts      (.getAllFonts env)
                  font       ^Font (some #(when (lato-names (.getName ^Font %)) %) fonts)]
              font))]
    (memoize get-lato*)))

(defn- lato-can-render?
  [s]
  (let [lato (get-lato)]
    (when lato
      (font-can-fully-render? lato s))))

(defn- wrap-non-lato-chars
  "Wrap characters not supported by the installed Lato font in a span so that we can explicitly set the font to sans-serif.
  We do this to work around unexpected font-fallback behaviours in CSSBox.

  Lato is properly loaded/registered in `metabase.channel.render.style/regiter-fonts!`, which means the
  java.awt GraphicsEnvironment has Lato available as a Physical font. The loaded physical font does not contain
  glyphs to properly render many international characters, and instead of falling back to another font on a per-glyph basis,
  it simply renders a '[?]', which is no good.

  If a given string, inside a `transformable-element` contains any character that isn't Lato-compatible, replace the entire string.
  This is done to make the string as consistent as possible (no mixing fonts in a single string)."
  [content]
  (let [transformable-els #{:div :span :td :th :tr :table :p :tbody :thead}
        string-wrapper    (fn [part]
                            (if (and (string? part)
                                     (not (lato-can-render? part)))
                              [:span {:style (style/style {:font-family "sans-serif"})} part]
                              part))]
    (walk/postwalk
     (fn [form]
       (if (and
            (not (map-entry? form))
            (vector? form)
            (transformable-els (first form)))
         (mapv string-wrapper form)
         form))
     content)))

(mu/defn render-html-to-png :- bytes?
  "Render the Hiccup HTML `content` of a Pulse to a PNG image, returning a byte array."
  ^bytes [{:keys [content]} :- ::body/RenderedPartCard
          width]
  (try
    (let [html (html [:html
                      [:body {:style (style/style
                                      {:font-family      "Lato, 'Helvetica Neue', 'Lucida Grande', sans-serif"
                                       :margin           0
                                       :padding          0
                                       :background-color :white})}
                       (wrap-non-lato-chars content)]])]
      (with-open [os (ByteArrayOutputStream.)]
        (-> (render-to-png html width)
            (write-image! "png" os))
        (.toByteArray os)))
    (catch Throwable e
      (log/error e "Error rendering Pulse")
      (throw e))))
