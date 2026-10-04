# Atomic Orbital Renderer
Renders beautiful looking atomic orbitals using the Schrodinger Wave Function.

<img src="images/orbitalPreview_31.png"><img/>

The first step is generating the layers. We add S, P, D, and F orbitals in order, until we run out of electrons.


For the quickest setup, use the <Viewer/> component from Viewer.tsx
Here is an example:

```html
import { Viewer } from "./Viewer";
<html>
  <body>
    <Viewer/>
  </body>
</html>
```

For custom pages, use the <Schrodinger/> component from Schrodinger.tsx.
Here is an example:
```html
<Schrodinger
  layers={currentLayers}
  version={version}
  visualScale={visualScale}
  renderMode={renderMode} />
```

# Gallery
<img src="images/orbitalPreview_15.png"><img/>
<img src="images/orbitalPreview_26.png"><img/>
<img src="images/orbitalPreview_30.png"><img/>
<img src="images/orbitalPreview_27.png"><img/>
