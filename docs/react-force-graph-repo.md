Directory structure:
└── vasturiano-react-force-graph/
    ├── README.md
    ├── _config.yml
    ├── LICENSE
    ├── rollup.config.dev.js
    ├── rollup.config.js
    ├── .babelrc
    ├── .npmignore
    ├── example/
    │   ├── all-modes/
    │   │   └── index.html
    │   ├── ar-graph/
    │   │   └── index.html
    │   ├── auto-colored/
    │   │   └── index.html
    │   ├── basic/
    │   │   └── index.html
    │   ├── bloom-effect/
    │   │   └── index.html
    │   ├── camera-auto-orbit/
    │   │   └── index.html
    │   ├── click-to-focus/
    │   │   └── index.html
    │   ├── collision-detection/
    │   │   └── index.html
    │   ├── curved-links/
    │   │   └── index.html
    │   ├── custom-node-shape/
    │   │   ├── index-canvas.html
    │   │   └── index-three.html
    │   ├── datasets/
    │   │   ├── d3-dependencies.csv
    │   │   └── random-data.js
    │   ├── directional-links-arrows/
    │   │   └── index.html
    │   ├── directional-links-particles/
    │   │   └── index.html
    │   ├── dynamic/
    │   │   └── index.html
    │   ├── emit-particles/
    │   │   └── index.html
    │   ├── expandable-nodes/
    │   │   └── index.html
    │   ├── fit-to-canvas/
    │   │   └── index.html
    │   ├── fix-dragged-nodes/
    │   │   └── index.html
    │   ├── forcegraph-dependencies/
    │   │   └── index.html
    │   ├── highlight/
    │   │   └── index.html
    │   ├── html-nodes/
    │   │   └── index.html
    │   ├── img-nodes/
    │   │   ├── index.html
    │   │   └── imgs/
    │   ├── large-graph/
    │   │   └── index.html
    │   ├── multi-selection/
    │   │   └── index.html
    │   ├── text-links/
    │   │   └── index-3d.html
    │   ├── text-nodes/
    │   │   ├── index-2d.html
    │   │   └── index-3d.html
    │   └── tree/
    │       └── index.html
    ├── src/
    │   ├── forcegraph-proptypes.js
    │   ├── index.d.ts
    │   ├── index.js
    │   └── packages/
    │       ├── react-force-graph-2d/
    │       │   ├── index.d.ts
    │       │   ├── index.js
    │       │   ├── rollup.config.dev.js
    │       │   └── rollup.config.js
    │       ├── react-force-graph-3d/
    │       │   ├── index.d.ts
    │       │   ├── index.js
    │       │   ├── rollup.config.dev.js
    │       │   └── rollup.config.js
    │       ├── react-force-graph-ar/
    │       │   ├── index.d.ts
    │       │   ├── index.js
    │       │   ├── rollup.config.dev.js
    │       │   └── rollup.config.js
    │       └── react-force-graph-vr/
    │           ├── index.d.ts
    │           ├── index.js
    │           ├── rollup.config.dev.js
    │           └── rollup.config.js
    └── .github/
        └── ISSUE_TEMPLATE/
            ├── bug_report.md
            └── feature_request.md


Files Content:

================================================
File: README.md
================================================
react-force-graph
=================

**2D**:
[![NPM package][npm-2d-img]][npm-2d-url]
[![Build Size][build-size-2d-img]][build-size-2d-url]
[![NPM Downloads][npm-downloads-2d-img]][npm-downloads-2d-url]

**3D**:
[![NPM package][npm-3d-img]][npm-3d-url]
[![Build Size][build-size-3d-img]][build-size-3d-url]
[![NPM Downloads][npm-downloads-3d-img]][npm-downloads-3d-url]

**VR**:
[![NPM package][npm-vr-img]][npm-vr-url]
[![Build Size][build-size-vr-img]][build-size-vr-url]
[![NPM Downloads][npm-downloads-vr-img]][npm-downloads-vr-url]

**AR**:
[![NPM package][npm-ar-img]][npm-ar-url]
[![Build Size][build-size-ar-img]][build-size-ar-url]
[![NPM Downloads][npm-downloads-ar-img]][npm-downloads-ar-url]

React bindings for the **force-graph** [suite](https://vasturiano.github.io/react-force-graph/example/forcegraph-dependencies) of components: [force-graph](https://github.com/vasturiano/force-graph) (2D HTML Canvas), [3d-force-graph](https://github.com/vasturiano/3d-force-graph) (ThreeJS/WebGL), [3d-force-graph-vr](https://github.com/vasturiano/3d-force-graph-vr) (A-Frame) and [3d-force-graph-ar](https://github.com/vasturiano/3d-force-graph-ar) (AR.js).

<p align="center">
  <a href="https://vasturiano.github.io/react-force-graph/example/large-graph/"><img width="80%" src="https://vasturiano.github.io/react-force-graph/example/preview.png"></a>
</p>

This module exports 4 stand-alone React component packages with identical interfaces: `react-force-graph-2d`, `react-force-graph-3d`, `react-force-graph-vr` and `react-force-graph-ar`.
Each can be used to represent a graph data structure in a 2 or 3-dimensional space using a force-directed iterative layout.

Uses canvas/WebGL for rendering and [d3-force-3d](https://github.com/vasturiano/d3-force-3d) for the underlying physics engine. 
Supports zooming/panning, node dragging and node/link hover/click interactions.

See also the [react-three-fiber component](https://github.com/vasturiano/r3f-forcegraph).

## Examples

* [Basic](https://vasturiano.github.io/react-force-graph/example/basic/) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/basic/index.html))
* [Directional arrows](https://vasturiano.github.io/react-force-graph/example/directional-links-arrows/) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/directional-links-arrows/index.html))
* [Directional moving particles](https://vasturiano.github.io/react-force-graph/example/directional-links-particles/) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/directional-links-particles/index.html))
* [Auto-colored nodes/links](https://vasturiano.github.io/react-force-graph/example/auto-colored/) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/auto-colored/index.html))
* [AR graph](https://vasturiano.github.io/react-force-graph/example/ar-graph/index.html) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/ar-graph/index.html))
* [2D Text nodes](https://vasturiano.github.io/react-force-graph/example/text-nodes/index-2d.html) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/text-nodes/index-2d.html))
* [3D Text nodes](https://vasturiano.github.io/react-force-graph/example/text-nodes/index-3d.html) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/text-nodes/index-3d.html))
* [Image nodes](https://vasturiano.github.io/react-force-graph/example/img-nodes/) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/img-nodes/index.html))
* [HTML in nodes](https://vasturiano.github.io/react-force-graph/example/html-nodes/) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/html-nodes/index.html))
* [Custom 2D node shapes](https://vasturiano.github.io/react-force-graph/example/custom-node-shape/index-canvas.html) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/custom-node-shape/index-canvas.html))
* [Custom 3D/VR node geometries](https://vasturiano.github.io/react-force-graph/example/custom-node-shape/index-three.html) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/custom-node-shape/index-three.html))
* [Curved lines and self links](https://vasturiano.github.io/react-force-graph/example/curved-links/) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/curved-links/index.html))
* [Text in links](https://vasturiano.github.io/react-force-graph/example/text-links/index-3d.html) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/text-links/index-3d.html))
* [Highlight nodes/links](https://vasturiano.github.io/react-force-graph/example/highlight/) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/highlight/index.html))
* [Multiple Node Selection](https://vasturiano.github.io/react-force-graph/example/multi-selection/) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/multi-selection/index.html))
* [Larger graph](https://vasturiano.github.io/react-force-graph/example/large-graph/) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/large-graph/index.html))
* [Dynamic data changes](https://vasturiano.github.io/react-force-graph/example/dynamic/) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/dynamic/index.html))
* [Click to focus on node](https://vasturiano.github.io/react-force-graph/example/click-to-focus/) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/click-to-focus/index.html))
* [Click to expand/collapse nodes](https://vasturiano.github.io/react-force-graph/example/expandable-nodes/) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/expandable-nodes/index.html))
* [Fix nodes after dragging](https://vasturiano.github.io/react-force-graph/example/fix-dragged-nodes/) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/fix-dragged-nodes/index.html))
* [Fit graph to canvas](https://vasturiano.github.io/react-force-graph/example/fit-to-canvas/) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/fit-to-canvas/index.html))
* [Camera automatic orbitting](https://vasturiano.github.io/react-force-graph/example/camera-auto-orbit/) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/camera-auto-orbit/index.html))
* [Node collision detection](https://vasturiano.github.io/react-force-graph/example/collision-detection/) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/collision-detection/index.html))
* [Emit link particles on demand](https://vasturiano.github.io/react-force-graph/example/emit-particles/) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/emit-particles/index.html))
* [Force-directed tree (DAG mode)](https://vasturiano.github.io/react-force-graph/example/tree/) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/tree/index.html))
* [Bloom Post-Processing Effect](https://vasturiano.github.io/react-force-graph/example/bloom-effect/) ([source](https://github.com/vasturiano/react-force-graph/blob/master/example/bloom-effect/index.html))

## Quick start

```js
import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';
import ForceGraphVR from 'react-force-graph-vr';
import ForceGraphAR from 'react-force-graph-ar';
```

or using a *script* tag

```html
<script src="//cdn.jsdelivr.net/npm/react-force-graph-2d"></script>
<script src="//cdn.jsdelivr.net/npm/react-force-graph-3d"></script>
<script src="//cdn.jsdelivr.net/npm/react-force-graph-vr"></script>
<script src="//cdn.jsdelivr.net/npm/react-force-graph-ar"></script>
```

then

```jsx
<ForceGraph3D
  graphData={myData}
/>
```

## API reference

Note that not all props listed below apply to all 4 components. The last 4 columns in these tables indicate the specific component availability of each prop/method.

### Data input

| Prop | Type | Default | Description | 2D | 3D | VR | AR |
| --- | :--: | :--: | --- | :--: | :--: | :--: | :--: |
| <b>graphData</b> | <i>object</i> | `{ nodes: [], links: [] }` | Graph data structure (see below for syntax details). Can also be used to apply incremental updates. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>nodeId</b> | <i>string</i> | `id` | Node object accessor attribute for unique node id (used in link objects source/target). | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>linkSource</b> | <i>string</i> | `source` | Link object accessor attribute referring to id of source node. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>linkTarget</b> | <i>string</i> | `target` | Link object accessor attribute referring to id of target node. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |

### Container layout

| Prop | Type | Default | Description | 2D | 3D | VR | AR |
| --- | :--: | :--: | --- | :--: | :--: | :--: | :--: |
| <b>width</b> | <i>number</i> | *&lt;window width&gt;* | Canvas width, in px. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>height</b> | <i>number</i> | *&lt;window height&gt;* | Canvas height, in px. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>backgroundColor</b> | <i>string</i> | (2D - <i>light</i> / 3D - <i>dark</i>)| Chart background color. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | |
| <b>showNavInfo</b> | <i>bool</i> | `true` | Whether to show the navigation controls footer info. | | :heavy_check_mark: | :heavy_check_mark: | |
| <b>yOffset</b> | <i>number</i> | 1.5 | In AR mode, defines the offset distance above the marker where to place the center coordinates `<0,0,0>` of the force directed graph. Measured in terms of marker width units. | | | | :heavy_check_mark: |
| <b>glScale</b> | <i>number</i> | 200 | In AR mode, defines the translation scale between real world distances and WebGL units, determining the overall size of the graph. Defined in terms of how many GL units fit in a full marker width. | | | | :heavy_check_mark: |
| <b>markerAttrs</b> | <i>object</i> | `{ preset: 'hiro' }` | Set of attributes that define the marker where the AR force directed graph is mounted, according to the [a-marker specification](https://ar-js-org.github.io/AR.js-Docs/marker-based/). This prop only has an effect on component mount. | | | | :heavy_check_mark: |

### Node styling

| Prop | Type | Default | Description | 2D | 3D | VR | AR |
| --- | :--: | :--: | --- | :--: | :--: | :--: | :--: |
| <b>nodeRelSize</b> | <i>number</i> | 4 | Ratio of node circle area (square px) [2D] or sphere volume (cubic px) [3D] per value unit. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>nodeVal</b> | <i>number</i>, <i>string</i> or <i>func</i> | `val` | Node object accessor function, attribute or a numeric constant for the node numeric value (affects node size). | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>nodeLabel</b> | <i>string</i> or <i>func</i> | `name` | Node object accessor function or attribute for name (shown in label). Supports plain text or HTML content (except in VR). | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | |
| <b>nodeDesc</b> | <i>string</i> or <i>func</i> | `desc` | For VR only. Node object accessor function or attribute for description (shown under label). | | | :heavy_check_mark: | |
| <b>nodeVisibility</b>| <i>bool</i>, <i>string</i> or <i>func</i> | `true` | Node object accessor function, attribute or a boolean constant for whether to display the node. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>nodeColor</b> | <i>string</i> or <i>func</i> | `color` | Node object accessor function or attribute for node color. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>nodeAutoColorBy</b> | <i>string</i> or <i>func</i> | | Node object accessor function or attribute to automatically group colors by. Only affects nodes without a color attribute. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>nodeOpacity</b> | <i>number</i> | 0.75 | Nodes sphere opacity, between [0,1]. | | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>nodeResolution</b> | <i>number</i> | 8 | Geometric resolution of each node's sphere, expressed in how many slice segments to divide the circumference. Higher values yield smoother spheres. Only applicable to 3D modes. | | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>nodeCanvasObject</b> | <i>func</i> | *default 2D node object is a circle, sized according to `val` and styled according to `color`.* | Callback function for painting a custom 2D canvas object to represent graph nodes. Should use the provided canvas context attribute to perform drawing operations for each node. The callback function will be called for each node at every frame, and has the signature: `nodeCanvasObject(<node>, <canvas context>, <current global scale>)`. | :heavy_check_mark: | | | |
| <b>nodeCanvasObjectMode</b> | <i>string</i> or <i>func</i> | `() => 'replace'` | Node object accessor function or attribute for the custom drawing mode. Use in combination with `nodeCanvasObject` to specify how to customize nodes painting. Possible values are: <ul><li>`replace`: the node is rendered using just `nodeCanvasObject`.</li><li>`before`: the node is rendered by invoking `nodeCanvasObject` and then proceeding with the default node painting.</li><li>`after`: `nodeCanvasObject` is applied after the default node painting takes place.</li></ul>Any other value will be ignored and the default drawing will be applied. | :heavy_check_mark: | | | |
| <b>nodeThreeObject</b> | <i>Object3d</i>, <i>string</i> or <i>func</i> | *default 3D node object is a sphere, sized according to `val` and styled according to `color`.* | Node object accessor function or attribute for generating a custom 3d object to render as graph nodes. Should return an instance of [ThreeJS Object3d](https://threejs.org/docs/index.html#api/core/Object3D). If a <i>falsy</i> value is returned, the default 3d object type will be used instead for that node. | | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>nodeThreeObjectExtend</b> | <i>bool</i>, <i>string</i> or <i>func</i> | `false` | Node object accessor function, attribute or a boolean value for whether to replace the default node when using a custom `nodeThreeObject` (`false`) or to extend it (`true`). | | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |

### Link styling

| Prop | Type | Default | Description | 2D | 3D | VR | AR |
| --- | :--: | :--: | --- | :--: | :--: | :--: | :--: |
| <b>linkLabel</b> | <i>string</i> or <i>func</i> | `name` | Link object accessor function or attribute for name (shown in label). Supports plain text or HTML content (except in VR). | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | |
| <b>linkDesc</b> | <i>string</i> or <i>func</i> | `desc` | For VR only. Link object accessor function or attribute for description (shown under label). | | | :heavy_check_mark: | |
| <b>linkVisibility</b>| <i>bool</i>, <i>string</i> or <i>func</i> | `true` | Link object accessor function, attribute or a boolean constant for whether to display the link line. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>linkColor</b>| <i>string</i> or <i>func</i> | `color` | Link object accessor function or attribute for line color. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>linkAutoColorBy</b> | <i>string</i> or <i>func</i> | | Link object accessor function or attribute to automatically group colors by. Only affects links without a color attribute. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>linkOpacity</b> | <i>number</i> | 0.2 | Line opacity of links, between [0,1]. | | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>linkLineDash</b> | <i>number[]</i>, <i>string</i> or <i>func</i>] | | Link object accessor function, attribute or number array (e.g. `[5, 15]`) to determine if a line dash should be applied to this rendered link. Refer to the [HTML canvas setLineDash API](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash) for example values. Either a falsy value or an empty array will disable dashing. | :heavy_check_mark: | | | |
| <b>linkWidth</b> | <i>number</i>, <i>string</i> or <i>func</i> | 1 | Link object accessor function, attribute or a numeric constant for the link line width. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>linkResolution</b> | <i>number</i> | 6 | Geometric resolution of each link 3D line, expressed in how many radial segments to divide the cylinder. Higher values yield smoother cylinders. Applicable only to links with positive width. | | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>linkCurvature</b> | <i>number</i>, <i>string</i> or <i>func</i> | 0 | Link object accessor function, attribute or a numeric constant for the curvature radius of the link line. A value of `0` renders a straight line. `1` indicates a radius equal to half of the line length, causing the curve to approximate a semi-circle. For self-referencing links (`source` equal to `target`) the curve is represented as a loop around the node, with length proportional to the curvature value. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>linkCurveRotation</b> | <i>number</i>, <i>string</i> or <i>func</i> | 0 | Link object accessor function, attribute or a numeric constant for the rotation along the line axis to apply to the curve. Has no effect on straight lines. At `0` rotation, the curve is oriented in the direction of the intersection with the `XY` plane. The rotation angle (in radians) will rotate the curved line clockwise around the "start-to-end" axis from this reference orientation. |  | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>linkMaterial</b> | <i>Material</i>, <i>string</i> or <i>func</i> | *default link material is [MeshLambertMaterial](https://threejs.org/docs/#api/materials/MeshLambertMaterial) styled according to `color` and `opacity`.* | Link object accessor function or attribute for specifying a custom material to style the graph links with. Should return an instance of [ThreeJS Material](https://threejs.org/docs/#api/materials/Material). If a <i>falsy</i> value is returned, the default material will be used instead for that link. | | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>linkCanvasObject</b> | <i>func</i> | *default 2D link object is a line, styled according to `width` and `color`.* | Callback function for painting a custom canvas object to represent graph links. Should use the provided canvas context attribute to perform drawing operations for each link. The callback function will be called for each link at every frame, and has the signature: `.linkCanvasObject(<link>, <canvas context>, <current global scale>)`. | :heavy_check_mark: | | | |
| <b>linkCanvasObjectMode</b> | <i>string</i> or <i>func</i> | `() => 'replace'` | Link object accessor function or attribute for the custom drawing mode. Use in combination with `linkCanvasObject` to specify how to customize links painting. Possible values are: <ul><li>`replace`: the link is rendered using just `linkCanvasObject`.</li><li>`before`: the link is rendered by invoking `linkCanvasObject` and then proceeding with the default link painting.</li><li>`after`: `linkCanvasObject` is applied after the default link painting takes place.</li></ul>Any other value will be ignored and the default drawing will be applied. | :heavy_check_mark: | | | |
| <b>linkThreeObject</b> | <i>Object3d</i>, <i>string</i> or <i>func</i> | *default 3D link object is a line or cylinder, sized according to `width` and styled according to `material`.* | Link object accessor function or attribute for generating a custom 3d object to render as graph links. Should return an instance of [ThreeJS Object3d](https://threejs.org/docs/index.html#api/core/Object3D). If a <i>falsy</i> value is returned, the default 3d object type will be used instead for that link. | | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>linkThreeObjectExtend</b> | <i>bool</i>, <i>string</i> or <i>func</i> | `false` | Link object accessor function, attribute or a boolean value for whether to replace the default link when using a custom `linkThreeObject` (`false`) or to extend it (`true`). | | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>linkPositionUpdate</b> | <i>func(linkObject, { start, end }, link)</i> | | Custom function to call for updating the position of links at every render iteration. It receives the respective link `ThreeJS Object3d`, the `start` and `end` coordinates of the link (`{x,y,z}` each), and the link's `data`. If the function returns a truthy value, the regular position update function will not run for that link. | | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>linkDirectionalArrowLength</b> | <i>number</i>, <i>string</i> or <i>func</i> | 0 | Link object accessor function, attribute or a numeric constant for the length of the arrow head indicating the link directionality. The arrow is displayed directly over the link line, and points in the direction of `source` > `target`. A value of `0` hides the arrow. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>linkDirectionalArrowColor</b> | <i>string</i> or <i>func</i> | `color` | Link object accessor function or attribute for the color of the arrow head. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>linkDirectionalArrowRelPos</b> | <i>number</i>, <i>string</i> or <i>func</i> | 0.5 | Link object accessor function, attribute or a numeric constant for the longitudinal position of the arrow head along the link line, expressed as a ratio between `0` and `1`, where `0` indicates immediately next to the `source` node, `1` next to the `target` node, and `0.5` right in the middle. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>linkDirectionalArrowResolution</b> | <i>number</i> | 8 | Geometric resolution of the arrow head, expressed in how many slice segments to divide the cone base circumference. Higher values yield smoother arrows. | | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>linkDirectionalParticles</b> | <i>number</i>, <i>string</i> or <i>func</i> | 0 | Link object accessor function, attribute or a numeric constant for the number of particles (small spheres) to display over the link line. The particles are distributed equi-spaced along the line, travel in the direction `source` > `target`, and can be used to indicate link directionality. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>linkDirectionalParticleSpeed</b> | <i>number</i>, <i>string</i> or <i>func</i> | 0.01 | Link object accessor function, attribute or a numeric constant for the directional particles speed, expressed as the ratio of the link length to travel per frame. Values above `0.5` are discouraged. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>linkDirectionalParticleWidth</b> | <i>number</i>, <i>string</i> or <i>func</i> | 0.5 | Link object accessor function, attribute or a numeric constant for the directional particles width. Values are rounded to the nearest decimal for indexing purposes. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>linkDirectionalParticleColor</b> | <i>string</i> or <i>func</i> | `color` | Link object accessor function or attribute for the directional particles color. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>linkDirectionalParticleResolution</b> | <i>number</i> | 4 | Geometric resolution of each 3D directional particle, expressed in how many slice segments to divide the circumference. Higher values yield smoother particles. | | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |

| Method | Arguments | Description | 2D | 3D | VR | AR |
| --- | :--: | --- | :--: | :--: | :--: | :--: |
| <b>emitParticle</b> | (<i>link</i>) | An alternative mechanism for generating particles, this method emits a non-cyclical single particle within a specific link. The emitted particle shares the styling (speed, width, color) of the regular particle props. A valid `link` object that is included in `graphData` should be passed as a single parameter. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |

### Render control

| Prop | Type | Default | Description | 2D | 3D | VR | AR |
| --- | :--: | :--: | --- | :--: | :--: | :--: | :--: |
| <b>rendererConfig</b> | <i>object</i> | `{ antialias: true, alpha: true }` | Configuration parameters to pass to the [ThreeJS WebGLRenderer](https://threejs.org/docs/#api/en/renderers/WebGLRenderer) constructor. This prop only has an effect on component mount. | | :heavy_check_mark: | | |
| <b>extraRenderers</b> | <i>array</i> | `[]` | If you wish to include custom objects that require a dedicated renderer besides `WebGL`, such as [CSS3DRenderer](https://threejs.org/docs/#examples/en/renderers/CSS3DRenderer), include in this array those extra renderer instances. | | :heavy_check_mark: | | |
| <b>autoPauseRedraw</b> | <i>bool</i> | `true` | Enable performance optimization to automatically pause redrawing the 2D canvas at every frame whenever the simulation engine is halted. If you have custom dynamic objects that rely on a constant redraw of the canvas, it's recommended to switch this option off. | :heavy_check_mark: | | | |
| <b>minZoom</b> | <i>number</i> | 0.01 | Lowest zoom out level permitted on the 2D canvas. | :heavy_check_mark: | | | |
| <b>maxZoom</b> | <i>number</i> | 1000 | Highest zoom in level permitted on the 2D canvas. | :heavy_check_mark: | | | |
| <b>onRenderFramePre</b> | <i>func</i> | *-* | Callback function to invoke at every frame, immediately before any node/link is rendered to the canvas. This can be used to draw additional external items on the canvas. The canvas context and the current global scale are included as parameters: `.onRenderFramePre(<canvas context>, <global scale>)`. | :heavy_check_mark: | | | |
| <b>onRenderFramePost</b> | <i>func</i> | *-* | Callback function to invoke at every frame, immediately after the last node/link is rendered to the canvas. This can be used to draw additional external items on the canvas. The canvas context and the current global scale are included as parameters: `.onRenderFramePost(<canvas context>, <global scale>)`. | :heavy_check_mark: | | | |

| Method | Arguments | Description | 2D | 3D | VR | AR |
| --- | :--: | --- | :--: | :--: | :--: | :--: |
| <b>pauseAnimation</b> | *-* | Pauses the rendering cycle of the component, effectively freezing the current view and cancelling all user interaction. This method can be used to save performance in circumstances when a static image is sufficient. | :heavy_check_mark: | :heavy_check_mark: | | |
| <b>resumeAnimation</b> | *-* | Resumes the rendering cycle of the component, and re-enables the user interaction. This method can be used together with `pauseAnimation` for performance optimization purposes. | :heavy_check_mark: | :heavy_check_mark: | | |
| <b>centerAt</b> | ([<i>x</i>], [<i>y</i>], [<i>ms</i>]) | Set the coordinates of the center of the viewport. This method can be used to perform panning on the 2D canvas programmatically. Each of the `x, y` coordinates is optional, allowing for motion in just one dimension. An optional 3rd argument defines the duration of the transition (in ms) to animate the canvas motion. | :heavy_check_mark: | | |
| <b>zoom</b> | ([<i>number</i>], [<i>ms</i>]) | Set the 2D canvas zoom amount. The zoom is defined in terms of the scale transform of each px. A value of `1` indicates unity, larger values zoom in and smaller values zoom out. An optional 2nd argument defines the duration of the transition (in ms) to animate the canvas motion. By default the zoom is set to a value inversely proportional to the amount of nodes in the system. | :heavy_check_mark: | | |
| <b>zoomToFit</b> | ([<i>ms</i>], [<i>px</i>], [<i>nodeFilterFn</i>]) | Automatically zooms/pans the canvas so that all of the nodes fit inside it. If no nodes are found no action is taken. It accepts two optional arguments: the first defines the duration of the transition (in ms) to animate the canvas motion (default: 0ms). The second argument is the amount of padding (in px) between the edge of the canvas and the outermost node (default: 10px). The third argument specifies a custom node filter: `node => <boolean>`, which should return a truthy value if the node is to be included. This can be useful for focusing on a portion of the graph. | :heavy_check_mark: | :heavy_check_mark: | | |
| <b>cameraPosition</b> | ([<i>{x,y,z}</i>],[<i>lookAt</i>], [<i>ms</i>]) | Re-position the camera, in terms of `x`, `y`, `z` coordinates. Each of the coordinates is optional, allowing for motion in just some dimensions. The optional second argument can be used to define the direction that the camera should aim at, in terms of an `{x,y,z}` point in the 3D space. The 3rd optional argument defines the duration of the transition (in ms) to animate the camera motion. A value of 0 (default) moves the camera immediately to the final position. By default the camera will face the center of the graph at a `z` distance proportional to the amount of nodes in the system. | | :heavy_check_mark: | | |
| <b>lights</b> | ([<i>array</i>]) | Getter/setter for the list of lights to use in the scene. Each item should be an instance of [Light](https://threejs.org/docs/#api/en/lights/Light). | | :heavy_check_mark: | | |
| <b>scene</b> | *-* | Access the internal ThreeJS [Scene](https://threejs.org/docs/#api/scenes/Scene). | | :heavy_check_mark: | | |
| <b>camera</b> | *-* | Access the internal ThreeJS [Camera](https://threejs.org/docs/#api/cameras/PerspectiveCamera). | | :heavy_check_mark: | | |
| <b>renderer</b> | *-* | Access the internal ThreeJS [WebGL renderer](https://threejs.org/docs/#api/renderers/WebGLRenderer). | | :heavy_check_mark: | | |
| <b>postProcessingComposer</b> | *-* | Access the [post-processing composer](https://threejs.org/docs/#examples/en/postprocessing/EffectComposer). Use this to add post-processing [rendering effects](https://github.com/mrdoob/three.js/tree/dev/examples/jsm/postprocessing) to the scene. By default the composer has a single pass ([RenderPass](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/postprocessing/RenderPass.js)) that directly renders the scene without any effects. | | :heavy_check_mark: | | | 
| <b>controls</b> | *-* | Access the internal ThreeJS controls object. | | :heavy_check_mark: | | |
| <b>refresh</b> | *-* | Redraws all the nodes/links. | | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |

### Force engine configuration

| Prop | Type | Default | Description | 2D | 3D | VR | AR |
| --- | :--: | :--: | --- | :--: | :--: | :--: | :--: |
| <b>numDimensions</b> | <i>1</i>, <i>2</i> or <i>3</i> | 3 | Not applicable to 2D mode. Number of dimensions to run the force simulation on. | | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>forceEngine</b> | <i>string</i> | `d3` | Which force-simulation engine to use ([*d3*](https://github.com/vasturiano/d3-force-3d) or [*ngraph*](https://github.com/anvaka/ngraph.forcelayout)). | | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>dagMode</b> | <i>string</i> | *-* | Apply layout constraints based on the graph directionality. Only works correctly for [DAG](https://en.wikipedia.org/wiki/Directed_acyclic_graph) graph structures (without cycles). Choice between `td` (top-down), `bu` (bottom-up), `lr` (left-to-right), `rl` (right-to-left), `zout` (near-to-far), `zin` (far-to-near), `radialout` (outwards-radially) or `radialin` (inwards-radially). | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>dagLevelDistance</b> | <i>number</i> | *auto-derived from the number of nodes* | If `dagMode` is engaged, this specifies the distance between the different graph depths. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>dagNodeFilter</b> | <i>func</i> | `node => true` | Node accessor function to specify nodes to ignore during the DAG layout processing. This accessor method receives a node object and should return a `boolean` value indicating whether the node is to be included. Excluded nodes will be left unconstrained and free to move in any direction. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>onDagError</b> | <i>func</i> | *-* | Callback to invoke if a cycle is encountered while processing the data structure for a DAG layout. The loop segment of the graph is included for information, as an array of node ids. By default an exception will be thrown whenever a loop is encountered. You can override this method to handle this case externally and allow the graph to continue the DAG processing. Strict graph directionality is not guaranteed if a loop is encountered and the result is a best effort to establish a hierarchy. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>d3AlphaMin</b> | <i>number</i> | 0 | Sets the [simulation alpha min](https://github.com/vasturiano/d3-force-3d#simulation_alphaMin) parameter. Only applicable if using the d3 simulation engine. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>d3AlphaDecay</b> | <i>number</i> | 0.0228 | Sets the [simulation intensity decay](https://github.com/vasturiano/d3-force-3d#simulation_alphaDecay) parameter. Only applicable if using the d3 simulation engine. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>d3VelocityDecay</b> | <i>number</i> | 0.4 | Nodes' [velocity decay](https://github.com/vasturiano/d3-force-3d#simulation_velocityDecay) that simulates the medium resistance. Only applicable if using the d3 simulation engine. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>ngraphPhysics</b> | <i>object</i> | *-* | Specify custom physics configuration for ngraph, according to its [configuration object](https://github.com/anvaka/ngraph.forcelayout#configuring-physics) syntax. Only applicable if using the ngraph simulation engine. | | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>warmupTicks</b> | <i>number</i> | 0 | Number of layout engine cycles to dry-run at ignition before starting to render. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>cooldownTicks</b> | <i>number</i> | Infinity | How many build-in frames to render before stopping and freezing the layout engine. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>cooldownTime</b> | <i>number</i> | 15000 | How long (ms) to render for before stopping and freezing the layout engine. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>onEngineTick</b> | <i>func</i> | *-* | Callback function invoked at every tick of the simulation engine. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>onEngineStop</b> | <i>func</i> | *-* | Callback function invoked when the simulation engine stops and the layout is frozen. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |

| Method | Arguments | Description | 2D | 3D | VR | AR |
| --- | :--: | --- | :--: | :--: | :--: | :--: |
| <b>d3Force</b> | (<i>string</i>, [<i>func</i>]) | Access to the internal forces that control the d3 simulation engine. Follows the same interface as `d3-force-3d`'s [simulation.force](https://github.com/vasturiano/d3-force-3d#simulation_force). Three forces are included by default: `'link'` (based on [forceLink](https://github.com/vasturiano/d3-force-3d#forceLink)), `'charge'` (based on [forceManyBody](https://github.com/vasturiano/d3-force-3d#forceManyBody)) and `'center'` (based on [forceCenter](https://github.com/vasturiano/d3-force-3d#forceCenter)). Each of these forces can be reconfigured, or new forces can be added to the system. Only applicable if using the d3 simulation engine. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>d3ReheatSimulation</b> | () | Reheats the force simulation engine, by setting the `alpha` value to `1`. Only applicable if using the d3 simulation engine. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |

### Interaction

| Prop | Type | Default | Description | 2D | 3D | VR | AR |
| --- | :--: | :--: | --- | :--: | :--: | :--: | :--: |
| <b>onNodeClick</b> | <i>func</i> | *-* | Callback function for node (left-button) clicks. The node object and the event object are included as arguments `onNodeClick(node, event)`. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>onNodeRightClick</b> | <i>func</i> | *-* | Callback function for node right-clicks. The node object and the event object are included as arguments `onNodeRightClick(node, event)`. | :heavy_check_mark: | :heavy_check_mark: | | |
| <b>onNodeHover</b> | <i>func</i> | *-* | Callback function for node mouse over events. The node object (or `null` if there's no node under the pointer line of sight) is included as the first argument, and the previous node object (or null) as second argument: `onNodeHover(node, prevNode)`. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>onNodeDrag</b> | <i>func</i> | *-* | Callback function for node drag interactions. This function is invoked repeatedly while dragging a node, every time its position is updated. The node object is included as the first argument, and the change in coordinates since the last iteration of this function are included as the second argument in format {x,y,z}: `onNodeDrag(node, translate)`. | :heavy_check_mark: | :heavy_check_mark: | | |
| <b>onNodeDragEnd</b> | <i>func</i> | *-* | Callback function for the end of node drag interactions. This function is invoked when the node is released. The node object is included as the first argument, and the change in coordinates from the node's initial postion are included as the second argument in format {x,y,z}: `onNodeDragEnd(node, translate)`. | :heavy_check_mark: | :heavy_check_mark: | | |
| <b>onLinkClick</b> | <i>func</i> | *-* | Callback function for link (left-button) clicks. The link object and the event object are included as arguments `onLinkClick(link, event)`. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>onLinkRightClick</b> | <i>func</i> | *-* | Callback function for link right-clicks. The link object and the event object are included as arguments `onLinkRightClick(link, event)`. | :heavy_check_mark: | :heavy_check_mark: | | |
| <b>onLinkHover</b> | <i>func</i> | *-* | Callback function for link mouse over events. The link object (or `null` if there's no link under the pointer line of sight) is included as the first argument, and the previous link object (or null) as second argument: `onLinkHover(link, prevLink)`. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>onBackgroundClick</b> | <i>func</i> | *-* | Callback function for click events on the empty space between the nodes and links. The event object is included as single argument `onBackgroundClick(event)`. | :heavy_check_mark: | :heavy_check_mark: | | |
| <b>onBackgroundRightClick</b> | <i>func</i> | *-* | Callback function for right-click events on the empty space between the nodes and links. The event object is included as single argument `onBackgroundRightClick(event)`. | :heavy_check_mark: | :heavy_check_mark: | | |
| <b>linkHoverPrecision</b> | <i>number</i> | 4 | Whether to display the link label when gazing the link closely (low value) or from far away (high value). | :heavy_check_mark: | :heavy_check_mark: | | |
| <b>onZoom</b> | <i>func</i> | *-* | Callback function for zoom/pan events. The current zoom transform is included as single argument `onZoom({ k, x, y })`. Note that `onZoom` is triggered by user interaction as well as programmatic zooming/panning with `zoom()` and `centerAt()`. | :heavy_check_mark: | | | |
| <b>onZoomEnd</b> | <i>func</i> | *-* | Callback function for on 'end' of zoom/pan events. The current zoom transform is included as single argument `onZoomEnd({ k, x, y })`. Note that `onZoomEnd` is triggered by user interaction as well as programmatic zooming/panning with `zoom()` and `centerAt()`. | :heavy_check_mark: | | | |
| <b>controlType</b> | <i>string</i> | `trackball` | Which type of control to use to control the camera on 3D mode. Choice between [trackball](https://threejs.org/examples/misc_controls_trackball.html), [orbit](https://threejs.org/examples/#misc_controls_orbit) or [fly](https://threejs.org/examples/misc_controls_fly.html). | | :heavy_check_mark: | | |
| <b>enableZoomInteraction</b> | <i>bool</i> | `true` | Whether to enable zooming user interactions on a 2D canvas. | :heavy_check_mark: | | | |
| <b>enablePanInteraction</b> | <i>bool</i> | `true` | Whether to enable panning user interactions on a 2D canvas. | :heavy_check_mark: | | | |
| <b>enableNavigationControls</b> | <i>bool</i> | `true` | Whether to enable the trackball navigation controls used to move the camera using mouse interactions (rotate/zoom/pan). | | :heavy_check_mark: | | |
| <b>enablePointerInteraction</b> | <i>bool</i> | `true` | Whether to enable the mouse tracking events. This activates an internal tracker of the canvas mouse position and enables the functionality of object hover/click and tooltip labels, at the cost of performance. If you're looking for maximum gain in your graph performance it's recommended to switch off this property. | :heavy_check_mark: | :heavy_check_mark: | | |
| <b>enableNodeDrag</b> | <i>bool</i> | `true` | Whether to enable the user interaction to drag nodes by click-dragging. If enabled, every time a node is dragged the simulation is re-heated so the other nodes react to the changes. Only applicable if enablePointerInteraction is `true`. | :heavy_check_mark: | :heavy_check_mark: | | |
| <b>nodePointerAreaPaint</b> | <i>func</i> | *default interaction area is a circle centered on the node and sized according to `val`.* | Callback function for painting a canvas area used to detect node pointer interactions. The provided paint color uniquely identifies the node and should be used to perform drawing operations on the provided canvas context. This painted area will not be visible, but instead be used to detect pointer interactions with the node. The callback function has the signature: `nodePointerAreaPaint(<node>, <color>, <canvas context>, <current global scale>)`. | :heavy_check_mark: | | | |
| <b>linkPointerAreaPaint</b> | <i>func</i> | *default interaction area is a straight line between the source and target nodes.* | Callback function for painting a canvas area used to detect link pointer interactions. The provided paint color uniquely identifies the link and should be used to perform drawing operations on the provided canvas context. This painted area will not be visible, but instead be used to detect pointer interactions with the link. The callback function has the signature: `linkPointerAreaPaint(<link>, <color>, <canvas context>, <current global scale>)`. | :heavy_check_mark: | | | |

###  Utility

| Method | Arguments | Description | 2D | 3D | VR | AR |
| --- | :--: | --- | :--: | :--: | :--: | :--: |
| <b>getGraphBbox</b> | ([<i>nodeFilterFn</i>]) | Returns the current bounding box of the nodes in the graph, formatted as `{ x: [<num>, <num>], y: [<num>, <num>], z: [<num>, <num>] }`. If no nodes are found, returns `null`. Accepts an optional argument to define a custom node filter: `node => <boolean>`, which should return a truthy value if the node is to be included. This can be useful to calculate the bounding box of a portion of the graph. | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| <b>screen2GraphCoords</b> | (<i>x</i>, <i>y</i>[, <i>distance</i>]) | Utility method to translate viewport coordinates to the graph domain. Given a pair of `x`,`y` screen coordinates, and optionally distance from camera for 3D mode, returns the current equivalent `{x, y (, z)}` in the domain of graph node coordinates. | :heavy_check_mark: | :heavy_check_mark: | | |
| <b>graph2ScreenCoords</b> | (<i>x</i>, <i>y</i>[, <i>z</i>]) | Utility method to translate node coordinates to the viewport domain. Given a set of `x`,`y`(,`z`) graph coordinates, returns the current equivalent `{x, y}` in viewport coordinates. | :heavy_check_mark: | :heavy_check_mark: | | |

### Input JSON syntax

```json
{
    "nodes": [ 
        { 
          "id": "id1",
          "name": "name1",
          "val": 1 
        },
        { 
          "id": "id2",
          "name": "name2",
          "val": 10 
        },
        ...
    ],
    "links": [
        {
            "source": "id1",
            "target": "id2"
        },
        ...
    ]
}
```

## Giving Back

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=L398E7PKP47E8&currency_code=USD&source=url) If this project has helped you and you'd like to contribute back, you can always [buy me a ☕](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=L398E7PKP47E8&currency_code=USD&source=url)!

[npm-2d-img]: https://img.shields.io/npm/v/react-force-graph-2d
[npm-3d-img]: https://img.shields.io/npm/v/react-force-graph-3d
[npm-vr-img]: https://img.shields.io/npm/v/react-force-graph-vr
[npm-ar-img]: https://img.shields.io/npm/v/react-force-graph-ar
[npm-2d-url]: https://npmjs.org/package/react-force-graph-2d
[npm-3d-url]: https://npmjs.org/package/react-force-graph-3d
[npm-vr-url]: https://npmjs.org/package/react-force-graph-vr
[npm-ar-url]: https://npmjs.org/package/react-force-graph-ar
[build-size-2d-img]: https://img.shields.io/bundlephobia/minzip/react-force-graph-2d
[build-size-3d-img]: https://img.shields.io/bundlephobia/minzip/react-force-graph-3d
[build-size-vr-img]: https://img.shields.io/bundlephobia/minzip/react-force-graph-vr
[build-size-ar-img]: https://img.shields.io/bundlephobia/minzip/react-force-graph-ar
[build-size-2d-url]: https://bundlephobia.com/result?p=react-force-graph-2d
[build-size-3d-url]: https://bundlephobia.com/result?p=react-force-graph-3d
[build-size-vr-url]: https://bundlephobia.com/result?p=react-force-graph-vr
[build-size-ar-url]: https://bundlephobia.com/result?p=react-force-graph-ar
[npm-downloads-2d-img]: https://img.shields.io/npm/dt/react-force-graph-2d
[npm-downloads-3d-img]: https://img.shields.io/npm/dt/react-force-graph-3d
[npm-downloads-vr-img]: https://img.shields.io/npm/dt/react-force-graph-vr
[npm-downloads-ar-img]: https://img.shields.io/npm/dt/react-force-graph-ar
[npm-downloads-2d-url]: https://www.npmtrends.com/react-force-graph-2d
[npm-downloads-3d-url]: https://www.npmtrends.com/react-force-graph-2d
[npm-downloads-vr-url]: https://www.npmtrends.com/react-force-graph-vr
[npm-downloads-ar-url]: https://www.npmtrends.com/react-force-graph-ar



================================================
File: _config.yml
================================================
theme: jekyll-theme-cayman


================================================
File: LICENSE
================================================
MIT License

Copyright (c) 2018 Vasco Asturiano

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.



================================================
File: rollup.config.dev.js
================================================
import buildConfig from './rollup.config.js';

// use first output of first config block for dev
const config = Array.isArray(buildConfig) ? buildConfig[0] : buildConfig;
Array.isArray(config.output) && (config.output = config.output[0]);

export default config;


================================================
File: rollup.config.js
================================================
import resolve from '@rollup/plugin-node-resolve';
import commonJs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import babel from '@rollup/plugin-babel';
import terser from "@rollup/plugin-terser";
import dts from 'rollup-plugin-dts';

import pkg from './package.json' with { type: 'json' };
const { name, homepage, version, dependencies, peerDependencies } = pkg;

const umdConf = {
  format: 'umd',
  name: 'ForceGraph',
  globals: { react: 'React' },
  banner: `// Version ${version} ${name} - ${homepage}`
};

export default [
  {
    external: ['react'],
    input: 'src/index.js',
    output: [
      {
        ...umdConf,
        file: `dist/${name}.js`,
        sourcemap: true
      },
      { // minify
        ...umdConf,
        file: `dist/${name}.min.js`,
        plugins: [terser({
          output: { comments: '/Version/' }
        })]
      }
    ],
    plugins: [
      replace({ 'process.env.NODE_ENV': JSON.stringify('development') }), // To fool React in the browser
      babel({ exclude: '**/node_modules/**' }),
      resolve(),
      commonJs()
    ]
  },
  { // ES module
    input: 'src/index.js',
    output: [
      {
        format: 'es',
        file: `dist/${name}.mjs`
      }
    ],
    external: [...Object.keys(dependencies), ...Object.keys(peerDependencies)],
    plugins: [
      babel()
    ]
  },
  { // expose TS declarations
    input: 'src/index.d.ts',
    output: [{
      file: `dist/${name}.d.ts`,
      format: 'es'
    }],
    plugins: [dts()]
  }
];


================================================
File: .babelrc
================================================
{
  "presets": [
    ["@babel/preset-env", { "modules": false }],
    "@babel/preset-react"
  ]
}


================================================
File: .npmignore
================================================
**/node_modules/
yarn.lock


================================================
File: example/all-modes/index.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

  <script src="//cdn.jsdelivr.net/npm/aframe"></script>
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import { ForceGraph2D, ForceGraph3D, ForceGraphVR } from 'https://esm.sh/react-force-graph?external=react';
    import React from 'react';
    import { createRoot } from 'react-dom';
    import { genRandomTree } from '../datasets/random-data.js';

    const comps = [ForceGraph2D, ForceGraph3D, ForceGraphVR];
    const compWidth = window.innerWidth / comps.length;

    createRoot(document.getElementById('graph')).render(
      <div style={{ display: 'flex' }}>
        {comps.map(Comp =>
          <Comp
            width={compWidth}
            graphData={genRandomTree()}
          />
        )}
      </div>
    );
  </script>
</body>


================================================
File: example/ar-graph/index.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

  <script src="//cdn.jsdelivr.net/npm/aframe"></script>
  <script src="//cdn.jsdelivr.net/npm/@ar-js-org/ar.js"></script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-ar/dist/react-force-graph-ar.js" defer></script>-->
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraphAR from 'https://esm.sh/react-force-graph-ar?external=react';
    import React from 'react';
    import { createRoot } from 'react-dom';

    fetch('../datasets/miserables.json').then(res => res.json()).then(data => {
      createRoot(document.getElementById('graph')).render(
        <ForceGraphAR
          glScale={160}
          yOffset={1.8}
          graphData={data}
          nodeAutoColorBy="group"
          nodeRelSize={5}
          linkWidth={1.5}
          nodeOpacity={0.9}
          linkOpacity={0.3}
          linkColor={() => 'darkgrey'}
        />
      );
    });
  </script>
</body>


================================================
File: example/auto-colored/index.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-3d/dist/react-force-graph-3d.js" defer></script>-->
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraph3D from 'https://esm.sh/react-force-graph-3d?external=react';
    import React from 'react';
    import { createRoot } from 'react-dom';
    import { genRandomTree } from '../datasets/random-data.js';

    const GROUPS = 12;
    const gData = genRandomTree();

    createRoot(document.getElementById('graph')).render(
      <ForceGraph3D
        graphData={gData}
        nodeAutoColorBy={d => d.id%GROUPS}
        linkAutoColorBy={d => gData.nodes[d.source].id%GROUPS}
        linkWidth={2}
      />
    );
  </script>
</body>


================================================
File: example/basic/index.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-3d/dist/react-force-graph-3d.js" defer></script>-->
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraph3D from 'https://esm.sh/react-force-graph-3d?external=react';
    import React from 'react';
    import { createRoot } from 'react-dom';
    import { genRandomTree } from '../datasets/random-data.js';

    createRoot(document.getElementById('graph')).render(
      <ForceGraph3D graphData={genRandomTree()}/>
    );
  </script>
</body>


================================================
File: example/bloom-effect/index.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-3d/dist/react-force-graph-3d.js" defer></script>-->
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraph3D from 'https://esm.sh/react-force-graph-3d?external=react';
    import React, { useRef, useEffect } from 'react';
    import { createRoot } from 'react-dom';
    import { UnrealBloomPass } from 'https://esm.sh/three/examples/jsm/postprocessing/UnrealBloomPass.js';

    fetch('../datasets/miserables.json').then(res => res.json()).then(data => {
      const FocusGraph = () => {
        const fgRef = useRef();

        useEffect(() => {
          const bloomPass = new UnrealBloomPass();
          bloomPass.strength = 4;
          bloomPass.radius = 1;
          bloomPass.threshold = 0;
          fgRef.current.postProcessingComposer().addPass(bloomPass);
        }, []);

        return <ForceGraph3D
          ref={fgRef}
          backgroundColor="#000003"
          graphData={data}
          nodeLabel="id"
          nodeAutoColorBy="group"
        />;
      };

      createRoot(document.getElementById('graph'))
        .render(<FocusGraph/>);
    });
  </script>
</body>


================================================
File: example/camera-auto-orbit/index.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-3d/dist/react-force-graph-3d.js" defer></script>-->
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraph3D from 'https://esm.sh/react-force-graph-3d?external=react';
    import React, { useEffect, useRef } from 'react';
    import { createRoot } from 'react-dom';
    import { genRandomTree } from '../datasets/random-data.js';

    const data = genRandomTree();
    const distance = 1400;

    const CameraOrbit = () => {
      const fgRef = useRef();

      useEffect(() => {
        fgRef.current.cameraPosition({ z: distance });

        // camera orbit
        let angle = 0;
        setInterval(() => {
          fgRef.current.cameraPosition({
            x: distance * Math.sin(angle),
            z: distance * Math.cos(angle)
          });
          angle += Math.PI / 300;
        }, 10);
      }, []);

      return <ForceGraph3D
        ref={fgRef}
        graphData={data}
        enableNodeDrag={false}
        enableNavigationControls={false}
        showNavInfo={false}
      />;
    };

    createRoot(document.getElementById('graph'))
      .render(<CameraOrbit />);
  </script>
</body>


================================================
File: example/click-to-focus/index.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-3d/dist/react-force-graph-3d.js" defer></script>-->
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraph3D from 'https://esm.sh/react-force-graph-3d?external=react';
    import React, { useRef, useCallback } from 'react';
    import { createRoot } from 'react-dom';

    fetch('../datasets/miserables.json').then(res => res.json()).then(data => {
      const FocusGraph = () => {
        const fgRef = useRef();

        const handleClick = useCallback(node => {
          // Aim at node from outside it
          const distance = 40;
          const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

          fgRef.current.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
            node, // lookAt ({ x, y, z })
            3000  // ms transition duration
          );
        }, [fgRef]);

        return <ForceGraph3D
          ref={fgRef}
          graphData={data}
          nodeLabel="id"
          nodeAutoColorBy="group"
          onNodeClick={handleClick}
        />;
      };

      createRoot(document.getElementById('graph'))
        .render(<FocusGraph />);
    });
  </script>
</body>


================================================
File: example/collision-detection/index.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-2d/dist/react-force-graph-2d.js" defer></script>-->
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraph2D from 'https://esm.sh/react-force-graph-2d?external=react';
    import React, { useState, useEffect, useRef } from 'react';
    import { createRoot } from 'react-dom';
    import { forceCollide }  from 'https://esm.sh/d3-force-3d';

    const CollisionDetectionFG = () => {
      const fgRef = useRef();

      const [graphData, setGraphData] = useState({ nodes: [], links: [] });

      useEffect(() => {
        const fg = fgRef.current;

        // Deactivate existing forces
        fg.d3Force('center', null);
        fg.d3Force('charge', null);

        // Add collision and bounding box forces
        fg.d3Force('collide', forceCollide(4));
        fg.d3Force('box', () => {
          const SQUARE_HALF_SIDE = N * 2;

          nodes.forEach(node => {
            const x = node.x || 0, y = node.y || 0;

            // bounce on box walls
            if (Math.abs(x) > SQUARE_HALF_SIDE) { node.vx *= -1; }
            if (Math.abs(y) > SQUARE_HALF_SIDE) { node.vy *= -1; }
          });
        });

        // Generate nodes
        const N = 80;
        const nodes = [...Array(N).keys()].map(() => ({
          // Initial velocity in random direction
          vx: (Math.random() * 2) - 1,
          vy: (Math.random() * 2) - 1
        }));

        setGraphData({ nodes, links: [] });
      }, []);

      return <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        cooldownTime={Infinity}
        d3AlphaDecay={0}
        d3VelocityDecay={0}
      />;
    };

    createRoot(document.getElementById('graph'))
      .render(<CollisionDetectionFG />);
  </script>
</body>


================================================
File: example/curved-links/index.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

  <script src="//cdn.jsdelivr.net/npm/aframe"></script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-vr/dist/react-force-graph-vr.js" defer></script>-->
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraphVR from 'https://esm.sh/react-force-graph-vr?external=react';
    import React from 'react';
    import { createRoot } from 'react-dom';

    const gData = {
      nodes: [...Array(14).keys()].map(i => ({ id: i })),
      links: [
        { source: 0, target: 1, curvature: 0, rotation: 0 },
        { source: 0, target: 1, curvature: 0.8, rotation: 0 },
        { source: 0, target: 1, curvature: 0.8, rotation: Math.PI * 1 / 6 },
        { source: 0, target: 1, curvature: 0.8, rotation: Math.PI * 2 / 6 },
        { source: 0, target: 1, curvature: 0.8, rotation: Math.PI * 3 / 6 },
        { source: 0, target: 1, curvature: 0.8, rotation: Math.PI * 4 / 6 },
        { source: 0, target: 1, curvature: 0.8, rotation: Math.PI * 5 / 6 },
        { source: 0, target: 1, curvature: 0.8, rotation: Math.PI },
        { source: 0, target: 1, curvature: 0.8, rotation: Math.PI * 7 / 6 },
        { source: 0, target: 1, curvature: 0.8, rotation: Math.PI * 8 / 6 },
        { source: 0, target: 1, curvature: 0.8, rotation: Math.PI * 9 / 6 },
        { source: 0, target: 1, curvature: 0.8, rotation: Math.PI * 10 / 6 },
        { source: 0, target: 1, curvature: 0.8, rotation: Math.PI * 11 / 6 },
        { source: 2, target: 3, curvature: 0.4, rotation: 0 },
        { source: 3, target: 2, curvature: 0.4, rotation: Math.PI / 2 },
        { source: 2, target: 3, curvature: 0.4, rotation: Math.PI },
        { source: 3, target: 2, curvature: 0.4, rotation: -Math.PI / 2 },
        { source: 4, target: 4, curvature: 0.3, rotation: 0 },
        { source: 4, target: 4, curvature: 0.3, rotation: Math.PI * 2 / 3 },
        { source: 4, target: 4, curvature: 0.3, rotation: Math.PI * 4 / 3 },
        { source: 5, target: 6, curvature: 0, rotation: 0 },
        { source: 5, target: 5, curvature: 0.5, rotation: 0 },
        { source: 6, target: 6, curvature: -0.5, rotation: 0 },
        { source: 7, target: 8, curvature: 0.2, rotation: 0 },
        { source: 8, target: 9, curvature: 0.5, rotation: 0 },
        { source: 9, target: 10, curvature: 0.7, rotation: 0 },
        { source: 10, target: 11, curvature: 1, rotation: 0 },
        { source: 11, target: 12, curvature: 2, rotation: 0 },
        { source: 12, target: 7, curvature: 4, rotation: 0 },
        { source: 13, target: 13, curvature: 0.1, rotation: 0 },
        { source: 13, target: 13, curvature: 0.2, rotation: 0 },
        { source: 13, target: 13, curvature: 0.5, rotation: 0 },
        { source: 13, target: 13, curvature: 0.7, rotation: 0 },
        { source: 13, target: 13, curvature: 1, rotation: 0 }
      ]
    };

    createRoot(document.getElementById('graph')).render(
      <ForceGraphVR
        graphData={gData}
        linkCurvature="curvature"
        linkCurveRotation="rotation"
        linkDirectionalParticles={2}
      />
    );
  </script>
</body>


================================================
File: example/custom-node-shape/index-canvas.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-2d/dist/react-force-graph-2d.js" defer></script>-->
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraph2D from 'https://esm.sh/react-force-graph-2d?external=react';
    import React from 'react';
    import { createRoot } from 'react-dom';
    import { genRandomTree } from '../datasets/random-data.js';

    function nodePaint({ id, x, y }, color, ctx) {
      ctx.fillStyle = color;
      [
        () => { ctx.fillRect(x - 6, y - 4, 12, 8); }, // rectangle
        () => { ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x - 5, y + 5); ctx.lineTo(x + 5, y + 5); ctx.fill(); }, // triangle
        () => { ctx.beginPath(); ctx.arc(x, y, 5, 0, 2 * Math.PI, false); ctx.fill(); }, // circle
        () => { ctx.font = '10px Sans-Serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Text', x, y); } // text
      ][id%4]();
    }

    // gen a number persistent color from around the palette
    const getColor = n => '#' + ((n * 1234567) % Math.pow(2, 24)).toString(16).padStart(6, '0');

    createRoot(document.getElementById('graph')).render(
      <ForceGraph2D
        graphData={genRandomTree(20)}
        nodeLabel="id"
        nodeCanvasObject={(node, ctx) => nodePaint(node, getColor(node.id), ctx)}
        nodePointerAreaPaint={nodePaint}
      />
    );
  </script>
</body>


================================================
File: example/custom-node-shape/index-three.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

  <script src="//cdn.jsdelivr.net/npm/aframe"></script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-vr/dist/react-force-graph-vr.js" defer></script>-->
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraphVR from 'https://esm.sh/react-force-graph-vr?external=react';
    import React from 'react';
    import { createRoot } from 'react-dom';
    import * as THREE from 'https://esm.sh/three';

    import { genRandomTree } from '../datasets/random-data.js';

    createRoot(document.getElementById('graph')).render(
      <ForceGraphVR
        graphData={genRandomTree(100)}
        nodeThreeObject={({ id }) => new THREE.Mesh(
          [
            new THREE.BoxGeometry(Math.random() * 20, Math.random() * 20, Math.random() * 20),
            new THREE.ConeGeometry(Math.random() * 10, Math.random() * 20),
            new THREE.CylinderGeometry(Math.random() * 10, Math.random() * 10, Math.random() * 20),
            new THREE.DodecahedronGeometry(Math.random() * 10),
            new THREE.SphereGeometry(Math.random() * 10),
            new THREE.TorusGeometry(Math.random() * 10, Math.random() * 2),
            new THREE.TorusKnotGeometry(Math.random() * 10, Math.random() * 2)
          ][id%7],
          new THREE.MeshLambertMaterial({
            color: Math.round(Math.random() * Math.pow(2, 24)),
            transparent: true,
            opacity: 0.75
          })
        )}
      />
    );
  </script>
</body>


================================================
File: example/datasets/d3-dependencies.csv
================================================
size,path
,d3
,d3/d3-array
,d3/d3-array/threshold
,d3/d3-axis
,d3/d3-brush
,d3/d3-chord
,d3/d3-collection
,d3/d3-color
,d3/d3-dispatch
,d3/d3-drag
,d3/d3-dsv
,d3/d3-ease
,d3/d3-force
,d3/d3-format
,d3/d3-geo
,d3/d3-geo/clip
,d3/d3-geo/path
,d3/d3-geo/projection
,d3/d3-hierarchy
,d3/d3-hierarchy/hierarchy
,d3/d3-hierarchy/pack
,d3/d3-hierarchy/treemap
,d3/d3-interpolate
,d3/d3-interpolate/transform
,d3/d3-path
,d3/d3-polygon
,d3/d3-quadtree
,d3/d3-queue
,d3/d3-random
,d3/d3-request
,d3/d3-scale
,d3/d3-selection
,d3/d3-selection/selection
,d3/d3-shape
,d3/d3-shape/curve
,d3/d3-shape/offset
,d3/d3-shape/order
,d3/d3-shape/symbol
,d3/d3-time-format
,d3/d3-time
,d3/d3-timer
,d3/d3-transition
,d3/d3-transition/selection
,d3/d3-transition/transition
,d3/d3-voronoi
,d3/d3-zoom
90,d3/d3-array/array.js
86,d3/d3-array/ascending.js
238,d3/d3-array/bisect.js
786,d3/d3-array/bisector.js
72,d3/d3-array/constant.js
86,d3/d3-array/descending.js
135,d3/d3-array/deviation.js
553,d3/d3-array/extent.js
1876,d3/d3-array/histogram.js
43,d3/d3-array/identity.js
451,d3/d3-array/max.js
362,d3/d3-array/mean.js
452,d3/d3-array/median.js
339,d3/d3-array/merge.js
451,d3/d3-array/min.js
63,d3/d3-array/number.js
182,d3/d3-array/pairs.js
161,d3/d3-array/permute.js
416,d3/d3-array/quantile.js
344,d3/d3-array/range.js
357,d3/d3-array/scan.js
285,d3/d3-array/shuffle.js
295,d3/d3-array/sum.js
361,d3/d3-array/threshold/freedmanDiaconis.js
180,d3/d3-array/threshold/scott.js
96,d3/d3-array/threshold/sturges.js
672,d3/d3-array/ticks.js
356,d3/d3-array/transpose.js
540,d3/d3-array/variance.js
99,d3/d3-array/zip.js
42,d3/d3-axis/array.js
5239,d3/d3-axis/axis.js
43,d3/d3-axis/identity.js
15778,d3/d3-brush/brush.js
72,d3/d3-brush/constant.js
127,d3/d3-brush/event.js
202,d3/d3-brush/noevent.js
42,d3/d3-chord/array.js
3178,d3/d3-chord/chord.js
72,d3/d3-chord/constant.js
159,d3/d3-chord/math.js
2340,d3/d3-chord/ribbon.js
137,d3/d3-collection/entries.js
104,d3/d3-collection/keys.js
1988,d3/d3-collection/map.js
2021,d3/d3-collection/nest.js
800,d3/d3-collection/set.js
115,d3/d3-collection/values.js
9276,d3/d3-color/color.js
1855,d3/d3-color/cubehelix.js
340,d3/d3-color/define.js
3167,d3/d3-color/lab.js
72,d3/d3-color/math.js
2729,d3/d3-dispatch/dispatch.js
72,d3/d3-drag/constant.js
4297,d3/d3-drag/drag.js
430,d3/d3-drag/event.js
857,d3/d3-drag/nodrag.js
202,d3/d3-drag/noevent.js
199,d3/d3-dsv/csv.js
3582,d3/d3-dsv/dsv.js
200,d3/d3-dsv/tsv.js
653,d3/d3-ease/back.js
521,d3/d3-ease/bounce.js
261,d3/d3-ease/circle.js
210,d3/d3-ease/cubic.js
1309,d3/d3-ease/elastic.js
251,d3/d3-ease/exp.js
43,d3/d3-ease/linear.js
596,d3/d3-ease/poly.js
192,d3/d3-ease/quad.js
236,d3/d3-ease/sin.js
654,d3/d3-force/center.js
2447,d3/d3-force/collide.js
72,d3/d3-force/constant.js
69,d3/d3-force/jiggle.js
3213,d3/d3-force/link.js
3181,d3/d3-force/manyBody.js
3444,d3/d3-force/simulation.js
1030,d3/d3-force/x.js
1030,d3/d3-force/y.js
361,d3/d3-format/defaultLocale.js
134,d3/d3-format/exponent.js
656,d3/d3-format/formatDecimal.js
368,d3/d3-format/formatDefault.js
475,d3/d3-format/formatGroup.js
611,d3/d3-format/formatPrefixAuto.js
458,d3/d3-format/formatRounded.js
1589,d3/d3-format/formatSpecifier.js
846,d3/d3-format/formatTypes.js
5247,d3/d3-format/locale.js
119,d3/d3-format/precisionFixed.js
190,d3/d3-format/precisionPrefix.js
186,d3/d3-format/precisionRound.js
906,d3/d3-geo/adder.js
1958,d3/d3-geo/area.js
5361,d3/d3-geo/bounds.js
929,d3/d3-geo/cartesian.js
3816,d3/d3-geo/centroid.js
2373,d3/d3-geo/circle.js
2897,d3/d3-geo/clip/antimeridian.js
470,d3/d3-geo/clip/buffer.js
5956,d3/d3-geo/clip/circle.js
5527,d3/d3-geo/clip/extent.js
3813,d3/d3-geo/clip/index.js
1099,d3/d3-geo/clip/line.js
2802,d3/d3-geo/clip/polygon.js
250,d3/d3-geo/compose.js
72,d3/d3-geo/constant.js
229,d3/d3-geo/distance.js
3034,d3/d3-geo/graticule.js
43,d3/d3-geo/identity.js
911,d3/d3-geo/interpolate.js
1309,d3/d3-geo/length.js
880,d3/d3-geo/math.js
34,d3/d3-geo/noop.js
945,d3/d3-geo/path/area.js
485,d3/d3-geo/path/bounds.js
2033,d3/d3-geo/path/centroid.js
914,d3/d3-geo/path/context.js
1690,d3/d3-geo/path/index.js
1149,d3/d3-geo/path/string.js
139,d3/d3-geo/pointEqual.js
2491,d3/d3-geo/polygonContains.js
235,d3/d3-geo/projection/albers.js
3986,d3/d3-geo/projection/albersUsa.js
502,d3/d3-geo/projection/azimuthal.js
447,d3/d3-geo/projection/azimuthalEqualArea.js
443,d3/d3-geo/projection/azimuthalEquidistant.js
402,d3/d3-geo/projection/conic.js
1017,d3/d3-geo/projection/conicConformal.js
871,d3/d3-geo/projection/conicEqualArea.js
771,d3/d3-geo/projection/conicEquidistant.js
314,d3/d3-geo/projection/cylindricalEqualArea.js
253,d3/d3-geo/projection/equirectangular.js
910,d3/d3-geo/projection/fit.js
387,d3/d3-geo/projection/gnomonic.js
1922,d3/d3-geo/projection/identity.js
3752,d3/d3-geo/projection/index.js
1119,d3/d3-geo/projection/mercator.js
376,d3/d3-geo/projection/orthographic.js
3275,d3/d3-geo/projection/resample.js
436,d3/d3-geo/projection/stereographic.js
762,d3/d3-geo/projection/transverseMercator.js
2509,d3/d3-geo/rotation.js
2305,d3/d3-geo/stream.js
701,d3/d3-geo/transform.js
166,d3/d3-hierarchy/accessors.js
2093,d3/d3-hierarchy/cluster.js
120,d3/d3-hierarchy/constant.js
138,d3/d3-hierarchy/hierarchy/ancestors.js
121,d3/d3-hierarchy/hierarchy/descendants.js
381,d3/d3-hierarchy/hierarchy/each.js
353,d3/d3-hierarchy/hierarchy/eachAfter.js
282,d3/d3-hierarchy/hierarchy/eachBefore.js
1819,d3/d3-hierarchy/hierarchy/index.js
164,d3/d3-hierarchy/hierarchy/leaves.js
246,d3/d3-hierarchy/hierarchy/links.js
606,d3/d3-hierarchy/hierarchy/path.js
151,d3/d3-hierarchy/hierarchy/sort.js
264,d3/d3-hierarchy/hierarchy/sum.js
2452,d3/d3-hierarchy/pack/enclose.js
1917,d3/d3-hierarchy/pack/index.js
389,d3/d3-hierarchy/pack/shuffle.js
3497,d3/d3-hierarchy/pack/siblings.js
1266,d3/d3-hierarchy/partition.js
1934,d3/d3-hierarchy/stratify.js
7060,d3/d3-hierarchy/tree.js
1184,d3/d3-hierarchy/treemap/binary.js
309,d3/d3-hierarchy/treemap/dice.js
2810,d3/d3-hierarchy/treemap/index.js
1029,d3/d3-hierarchy/treemap/resquarify.js
166,d3/d3-hierarchy/treemap/round.js
309,d3/d3-hierarchy/treemap/slice.js
170,d3/d3-hierarchy/treemap/sliceDice.js
1868,d3/d3-hierarchy/treemap/squarify.js
372,d3/d3-interpolate/array.js
600,d3/d3-interpolate/basis.js
360,d3/d3-interpolate/basisClosed.js
697,d3/d3-interpolate/color.js
72,d3/d3-interpolate/constant.js
760,d3/d3-interpolate/cubehelix.js
134,d3/d3-interpolate/date.js
547,d3/d3-interpolate/hcl.js
547,d3/d3-interpolate/hsl.js
447,d3/d3-interpolate/lab.js
100,d3/d3-interpolate/number.js
390,d3/d3-interpolate/object.js
163,d3/d3-interpolate/quantize.js
1277,d3/d3-interpolate/rgb.js
112,d3/d3-interpolate/round.js
1758,d3/d3-interpolate/string.js
672,d3/d3-interpolate/transform/decompose.js
2064,d3/d3-interpolate/transform/index.js
980,d3/d3-interpolate/transform/parse.js
598,d3/d3-interpolate/value.js
1387,d3/d3-interpolate/zoom.js
4089,d3/d3-path/path.js
243,d3/d3-polygon/area.js
346,d3/d3-polygon/centroid.js
411,d3/d3-polygon/contains.js
402,d3/d3-polygon/cross.js
1710,d3/d3-polygon/hull.js
375,d3/d3-polygon/length.js
2441,d3/d3-quadtree/add.js
1667,d3/d3-quadtree/cover.js
170,d3/d3-quadtree/data.js
206,d3/d3-quadtree/extent.js
1696,d3/d3-quadtree/find.js
134,d3/d3-quadtree/quad.js
2077,d3/d3-quadtree/quadtree.js
1898,d3/d3-quadtree/remove.js
51,d3/d3-quadtree/root.js
155,d3/d3-quadtree/size.js
695,d3/d3-quadtree/visit.js
773,d3/d3-quadtree/visitAfter.js
138,d3/d3-quadtree/x.js
138,d3/d3-quadtree/y.js
29,d3/d3-queue/array.js
2870,d3/d3-queue/queue.js
168,d3/d3-random/bates.js
113,d3/d3-random/exponential.js
137,d3/d3-random/irwinHall.js
178,d3/d3-random/logNormal.js
503,d3/d3-random/normal.js
236,d3/d3-random/uniform.js
101,d3/d3-request/csv.js
517,d3/d3-request/dsv.js
157,d3/d3-request/html.js
127,d3/d3-request/json.js
4593,d3/d3-request/request.js
109,d3/d3-request/text.js
118,d3/d3-request/tsv.js
370,d3/d3-request/type.js
174,d3/d3-request/xml.js
90,d3/d3-scale/array.js
2637,d3/d3-scale/band.js
119,d3/d3-scale/category10.js
179,d3/d3-scale/category20.js
179,d3/d3-scale/category20b.js
179,d3/d3-scale/category20c.js
101,d3/d3-scale/colors.js
72,d3/d3-scale/constant.js
3328,d3/d3-scale/continuous.js
188,d3/d3-scale/cubehelix.js
463,d3/d3-scale/identity.js
1206,d3/d3-scale/linear.js
3273,d3/d3-scale/log.js
340,d3/d3-scale/nice.js
44,d3/d3-scale/number.js
1116,d3/d3-scale/ordinal.js
1000,d3/d3-scale/pow.js
1280,d3/d3-scale/quantile.js
1066,d3/d3-scale/quantize.js
536,d3/d3-scale/rainbow.js
717,d3/d3-scale/sequential.js
802,d3/d3-scale/threshold.js
1203,d3/d3-scale/tickFormat.js
4565,d3/d3-scale/time.js
379,d3/d3-scale/utcTime.js
6471,d3/d3-scale/viridis.js
72,d3/d3-selection/constant.js
662,d3/d3-selection/creator.js
536,d3/d3-selection/local.js
533,d3/d3-selection/matcher.js
224,d3/d3-selection/mouse.js
303,d3/d3-selection/namespace.js
254,d3/d3-selection/namespaces.js
448,d3/d3-selection/point.js
259,d3/d3-selection/select.js
282,d3/d3-selection/selectAll.js
235,d3/d3-selection/selection/append.js
1460,d3/d3-selection/selection/attr.js
134,d3/d3-selection/selection/call.js
1740,d3/d3-selection/selection/classed.js
3597,d3/d3-selection/selection/data.js
132,d3/d3-selection/selection/datum.js
869,d3/d3-selection/selection/dispatch.js
289,d3/d3-selection/selection/each.js
53,d3/d3-selection/selection/empty.js
792,d3/d3-selection/selection/enter.js
176,d3/d3-selection/selection/exit.js
546,d3/d3-selection/selection/filter.js
520,d3/d3-selection/selection/html.js
2216,d3/d3-selection/selection/index.js
468,d3/d3-selection/selection/insert.js
171,d3/d3-selection/selection/lower.js
575,d3/d3-selection/selection/merge.js
258,d3/d3-selection/selection/node.js
140,d3/d3-selection/selection/nodes.js
3119,d3/d3-selection/selection/on.js
367,d3/d3-selection/selection/order.js
617,d3/d3-selection/selection/property.js
138,d3/d3-selection/selection/raise.js
153,d3/d3-selection/selection/remove.js
653,d3/d3-selection/selection/select.js
550,d3/d3-selection/selection/selectAll.js
98,d3/d3-selection/selection/size.js
681,d3/d3-selection/selection/sort.js
71,d3/d3-selection/selection/sparse.js
889,d3/d3-selection/selection/style.js
528,d3/d3-selection/selection/text.js
152,d3/d3-selection/selector.js
171,d3/d3-selection/selectorAll.js
175,d3/d3-selection/sourceEvent.js
407,d3/d3-selection/touch.js
323,d3/d3-selection/touches.js
218,d3/d3-selection/window.js
8831,d3/d3-shape/arc.js
2917,d3/d3-shape/area.js
42,d3/d3-shape/array.js
81,d3/d3-shape/constant.js
1436,d3/d3-shape/curve/basis.js
1530,d3/d3-shape/curve/basisClosed.js
1069,d3/d3-shape/curve/basisOpen.js
1081,d3/d3-shape/curve/bundle.js
1633,d3/d3-shape/curve/cardinal.js
1605,d3/d3-shape/curve/cardinalClosed.js
1288,d3/d3-shape/curve/cardinalOpen.js
2637,d3/d3-shape/curve/catmullRom.js
2083,d3/d3-shape/curve/catmullRomClosed.js
1760,d3/d3-shape/curve/catmullRomOpen.js
738,d3/d3-shape/curve/linear.js
514,d3/d3-shape/curve/linearClosed.js
3203,d3/d3-shape/curve/monotone.js
1761,d3/d3-shape/curve/natural.js
655,d3/d3-shape/curve/radial.js
1367,d3/d3-shape/curve/step.js
86,d3/d3-shape/descending.js
43,d3/d3-shape/identity.js
1516,d3/d3-shape/line.js
106,d3/d3-shape/math.js
29,d3/d3-shape/noop.js
319,d3/d3-shape/offset/expand.js
310,d3/d3-shape/offset/none.js
314,d3/d3-shape/offset/silhouette.js
740,d3/d3-shape/offset/wiggle.js
305,d3/d3-shape/order/ascending.js
112,d3/d3-shape/order/descending.js
545,d3/d3-shape/order/insideOut.js
120,d3/d3-shape/order/none.js
97,d3/d3-shape/order/reverse.js
2336,d3/d3-shape/pie.js
81,d3/d3-shape/point.js
934,d3/d3-shape/radialArea.js
396,d3/d3-shape/radialLine.js
1432,d3/d3-shape/stack.js
186,d3/d3-shape/symbol/circle.js
476,d3/d3-shape/symbol/cross.js
307,d3/d3-shape/symbol/diamond.js
137,d3/d3-shape/symbol/square.js
609,d3/d3-shape/symbol/star.js
255,d3/d3-shape/symbol/triangle.js
733,d3/d3-shape/symbol/wye.js
1160,d3/d3-shape/symbol.js
867,d3/d3-time-format/defaultLocale.js
284,d3/d3-time-format/isoFormat.js
319,d3/d3-time-format/isoParse.js
13876,d3/d3-time-format/locale.js
462,d3/d3-time/day.js
164,d3/d3-time/duration.js
569,d3/d3-time/hour.js
1845,d3/d3-time/interval.js
668,d3/d3-time/millisecond.js
437,d3/d3-time/minute.js
414,d3/d3-time/month.js
440,d3/d3-time/second.js
397,d3/d3-time/utcDay.js
399,d3/d3-time/utcHour.js
412,d3/d3-time/utcMinute.js
453,d3/d3-time/utcMonth.js
979,d3/d3-time/utcWeek.js
808,d3/d3-time/utcYear.js
963,d3/d3-time/week.js
754,d3/d3-time/year.js
400,d3/d3-timer/interval.js
250,d3/d3-timer/timeout.js
2771,d3/d3-timer/timer.js
484,d3/d3-transition/active.js
665,d3/d3-transition/interrupt.js
245,d3/d3-transition/selection/index.js
138,d3/d3-transition/selection/interrupt.js
1090,d3/d3-transition/selection/transition.js
2473,d3/d3-transition/transition/attr.js
904,d3/d3-transition/transition/attrTween.js
510,d3/d3-transition/transition/delay.js
528,d3/d3-transition/transition/duration.js
348,d3/d3-transition/transition/ease.js
574,d3/d3-transition/transition/filter.js
1892,d3/d3-transition/transition/index.js
340,d3/d3-transition/transition/interpolate.js
653,d3/d3-transition/transition/merge.js
853,d3/d3-transition/transition/on.js
284,d3/d3-transition/transition/remove.js
4792,d3/d3-transition/transition/schedule.js
826,d3/d3-transition/transition/select.js
883,d3/d3-transition/transition/selectAll.js
174,d3/d3-transition/transition/selection.js
2119,d3/d3-transition/transition/style.js
607,d3/d3-transition/transition/styleTween.js
473,d3/d3-transition/transition/text.js
691,d3/d3-transition/transition/transition.js
2026,d3/d3-transition/transition/tween.js
4381,d3/d3-voronoi/Beach.js
4087,d3/d3-voronoi/Cell.js
1632,d3/d3-voronoi/Circle.js
72,d3/d3-voronoi/constant.js
3415,d3/d3-voronoi/Diagram.js
3634,d3/d3-voronoi/Edge.js
81,d3/d3-voronoi/point.js
5302,d3/d3-voronoi/RedBlackTree.js
1420,d3/d3-voronoi/voronoi.js
72,d3/d3-zoom/constant.js
137,d3/d3-zoom/event.js
202,d3/d3-zoom/noevent.js
1336,d3/d3-zoom/transform.js
12133,d3/d3-zoom/zoom.js


================================================
File: example/datasets/random-data.js
================================================
export function genRandomTree(N = 300, reverse = false) {
  return {
    nodes: [...Array(N).keys()].map(i => ({ id: i })),
      links: [...Array(N).keys()]
    .filter(id => id)
    .map(id => ({
      [reverse ? 'target' : 'source']: id,
      [reverse ? 'source' : 'target']: Math.round(Math.random() * (id-1))
    }))
  };
}


================================================
File: example/directional-links-arrows/index.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-3d/dist/react-force-graph-3d.js" defer></script>-->
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraph3D from 'https://esm.sh/react-force-graph-3d?external=react';
    import React from 'react';
    import { createRoot } from 'react-dom';
    import { genRandomTree } from '../datasets/random-data.js';

    createRoot(document.getElementById('graph')).render(
      <ForceGraph3D
        graphData={genRandomTree(40)}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0.25}
      />
    );
  </script>
</body>


================================================
File: example/directional-links-particles/index.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-2d/dist/react-force-graph-2d.js" defer></script>-->
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraph2D from 'https://esm.sh/react-force-graph-2d?external=react';
    import React from 'react';
    import { createRoot } from 'react-dom';

    fetch('../datasets/miserables.json').then(res => res.json()).then(data => {
      createRoot(document.getElementById('graph')).render(
        <ForceGraph2D
          graphData={data}
          nodeLabel="id"
          nodeAutoColorBy="group"
          linkDirectionalParticles="value"
          linkDirectionalParticleSpeed={d => d.value * 0.001}
        />
      );
    });
  </script>
</body>


================================================
File: example/dynamic/index.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-3d/dist/react-force-graph-3d.js" defer></script>-->
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraph3D from 'https://esm.sh/react-force-graph-3d?external=react';
    import React, { useState, useEffect, useCallback } from 'react';
    import { createRoot } from 'react-dom';

    const DynamicGraph = () => {
      const [data, setData] = useState({ nodes: [{ id: 0 }], links: [] });

      useEffect(() => {
        setInterval(() => {
          // Add a new connected node every second
          setData(({ nodes, links }) => {
            const id = nodes.length;
            return {
              nodes: [...nodes, { id }],
              links: [...links, { source: id, target: Math.round(Math.random() * (id-1)) }]
            };
          });
        }, 1000);
      }, []);

      const handleClick = useCallback(node => {
        const { nodes, links } = data;

        // Remove node on click
        const newLinks = links.filter(l => l.source !== node && l.target !== node); // Remove links attached to node
        const newNodes = nodes.slice();
        newNodes.splice(node.id, 1); // Remove node
        newNodes.forEach((n, idx) => { n.id = idx; }); // Reset node ids to array index

        setData({ nodes: newNodes, links: newLinks });
      }, [data, setData]);

      return <ForceGraph3D
        enableNodeDrag={false}
        onNodeClick={handleClick}
        graphData={data}
      />;
    };

    createRoot(document.getElementById('graph'))
      .render(<DynamicGraph />);
  </script>
</body>


================================================
File: example/emit-particles/index.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-3d/dist/react-force-graph-3d.js" defer></script>-->
</head>

<body>
<div id="graph"></div>

<script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
<script type="text/jsx" data-type="module">
  import ForceGraph3D from 'https://esm.sh/react-force-graph-3d?external=react';
  import React, { useRef } from 'react';
  import { createRoot } from 'react-dom';
  import { genRandomTree } from '../datasets/random-data.js';

  const data = genRandomTree();

  const EmitParticles = () => {
    const fgRef = useRef();

    return <ForceGraph3D
      ref={fgRef}
      graphData={data}
      linkDirectionalParticleColor={() => 'red'}
      linkDirectionalParticleWidth={6}
      linkHoverPrecision={10}
      onLinkClick={link => fgRef.current.emitParticle(link)}
    />;
  };

  createRoot(document.getElementById('graph'))
    .render(<EmitParticles />);
</script>
</body>


================================================
File: example/expandable-nodes/index.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-3d/dist/react-force-graph-3d.js" defer></script>-->
</head>

<body>
<div id="graph"></div>

<script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
<script type="text/jsx" data-type="module">
  import ForceGraph3D from 'https://esm.sh/react-force-graph-3d?external=react';
  import React, { useState, useMemo, useCallback } from 'react';
  import { createRoot } from 'react-dom';
  import { genRandomTree } from '../datasets/random-data.js';

  const ExpandableGraph = ({ graphData }) => {
    const rootId = 0;

    const nodesById = useMemo(() => {
      const nodesById = Object.fromEntries(graphData.nodes.map(node => [node.id, node]));

      // link parent/children
      graphData.nodes.forEach(node => {
        node.collapsed = node.id !== rootId;
        node.childLinks = [];
      });
      graphData.links.forEach(link => nodesById[link.source].childLinks.push(link));

      return nodesById;
    }, [graphData]);

    const getPrunedTree = useCallback(() => {
      const visibleNodes = [];
      const visibleLinks = [];
      (function traverseTree(node = nodesById[rootId]) {
        visibleNodes.push(node);
        if (node.collapsed) return;
        visibleLinks.push(...node.childLinks);
        node.childLinks
          .map(link => ((typeof link.target) === 'object') ? link.target : nodesById[link.target]) // get child node
          .forEach(traverseTree);
      })();

      return { nodes: visibleNodes, links: visibleLinks };
    }, [nodesById]);

    const [prunedTree, setPrunedTree] = useState(getPrunedTree());

    const handleNodeClick = useCallback(node => {
      node.collapsed = !node.collapsed; // toggle collapse state
      setPrunedTree(getPrunedTree())
    }, []);

    return <ForceGraph3D
      graphData={prunedTree}
      linkDirectionalParticles={2}
      nodeColor={node => !node.childLinks.length ? 'green' : node.collapsed ? 'red' : 'yellow'}
      onNodeClick={handleNodeClick}
    />;
  };

  createRoot(document.getElementById('graph')).render(
    <ExpandableGraph graphData={genRandomTree(600, true)}/>
  );
</script>
</body>


================================================
File: example/fit-to-canvas/index.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-2d/dist/react-force-graph-2d.js" defer></script>-->
</head>

<body>
<div id="graph"></div>

<script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
<script type="text/jsx" data-type="module">
  import ForceGraph2D from 'https://esm.sh/react-force-graph-2d?external=react';
  import React, { useRef } from 'react';
  import { createRoot } from 'react-dom';
  import { genRandomTree } from '../datasets/random-data.js';

  const data = genRandomTree();
  const Graph = () => {
    const fgRef = useRef();

    return <ForceGraph2D
      ref={fgRef}
      graphData={data}
      cooldownTicks={100}
      onEngineStop={() => fgRef.current.zoomToFit(400)}
    />;
  };

  createRoot(document.getElementById('graph'))
    .render(<Graph />);
</script>
</body>


================================================
File: example/fix-dragged-nodes/index.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-3d/dist/react-force-graph-3d.js" defer></script>-->
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraph3D from 'https://esm.sh/react-force-graph-3d?external=react';
    import React from 'react';
    import { createRoot } from 'react-dom';

    fetch('../datasets/miserables.json').then(res => res.json()).then(data => {
      createRoot(document.getElementById('graph')).render(
        <ForceGraph3D
          graphData={data}
          nodeLabel="id"
          nodeAutoColorBy="group"
          onNodeDragEnd={node => {
            node.fx = node.x;
            node.fy = node.y;
            node.fz = node.z;
          }}
        />
      );
    });
  </script>
</body>


================================================
File: example/forcegraph-dependencies/index.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-3d/dist/react-force-graph-3d.js" defer></script>-->
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraph3D from 'https://esm.sh/react-force-graph-3d?external=react';
    import React from 'react';
    import { createRoot } from 'react-dom';
    import SpriteText from "https://esm.sh/three-spritetext";

    fetch('../datasets/forcegraph-dependencies.json').then(res => res.json()).then(depData => {
      const elem = document.getElementById('graph');

      createRoot(elem).render(
        <ForceGraph3D
          graphData={depData}
          dagMode="lr"
          dagLevelDistance={60}
          nodeId="package"
          nodeAutoColorBy="user"
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={0.5}
          onNodeClick={node => window.open(`https://github.com/${node.user}/${node.package}`, '_blank')}
          nodeThreeObject={node => {
            const sprite = new SpriteText(node.package);
            sprite.color = node.color;
            sprite.textHeight = 5;
            return sprite;
          }}
        />
      );
    });
  </script>
</body>


================================================
File: example/highlight/index.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-2d/dist/react-force-graph-2d.js" defer></script>-->
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraph2D from 'https://esm.sh/react-force-graph-2d?external=react';
    import React, { useMemo, useState, useCallback } from 'react';
    import { createRoot } from 'react-dom';
    import { genRandomTree } from '../datasets/random-data.js';

    const NODE_R = 8;
    const HighlightGraph = () => {
      const data = useMemo(() => {
        const gData = genRandomTree(80);

        // cross-link node objects
        gData.links.forEach(link => {
          const a = gData.nodes[link.source];
          const b = gData.nodes[link.target];
          !a.neighbors && (a.neighbors = []);
          !b.neighbors && (b.neighbors = []);
          a.neighbors.push(b);
          b.neighbors.push(a);

          !a.links && (a.links = []);
          !b.links && (b.links = []);
          a.links.push(link);
          b.links.push(link);
        });

        return gData;
      }, []);

      const [highlightNodes, setHighlightNodes] = useState(new Set());
      const [highlightLinks, setHighlightLinks] = useState(new Set());
      const [hoverNode, setHoverNode] = useState(null);

      const updateHighlight = () => {
        setHighlightNodes(highlightNodes);
        setHighlightLinks(highlightLinks);
      };

      const handleNodeHover = node => {
        highlightNodes.clear();
        highlightLinks.clear();
        if (node) {
          highlightNodes.add(node);
          node.neighbors.forEach(neighbor => highlightNodes.add(neighbor));
          node.links.forEach(link => highlightLinks.add(link));
        }

        setHoverNode(node || null);
        updateHighlight();
      };

      const handleLinkHover = link => {
        highlightNodes.clear();
        highlightLinks.clear();

        if (link) {
          highlightLinks.add(link);
          highlightNodes.add(link.source);
          highlightNodes.add(link.target);
        }

        updateHighlight();
      };

      const paintRing = useCallback((node, ctx) => {
        // add ring just for highlighted nodes
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_R * 1.4, 0, 2 * Math.PI, false);
        ctx.fillStyle = node === hoverNode ? 'red' : 'orange';
        ctx.fill();
      }, [hoverNode]);

      return <ForceGraph2D
        graphData={data}
        nodeRelSize={NODE_R}
        autoPauseRedraw={false}
        linkWidth={link => highlightLinks.has(link) ? 5 : 1}
        linkDirectionalParticles={4}
        linkDirectionalParticleWidth={link => highlightLinks.has(link) ? 4 : 0}
        nodeCanvasObjectMode={node => highlightNodes.has(node) ? 'before' : undefined}
        nodeCanvasObject={paintRing}
        onNodeHover={handleNodeHover}
        onLinkHover={handleLinkHover}
      />;
    };

    createRoot(document.getElementById('graph'))
      .render(<HighlightGraph />);
  </script>
</body>


================================================
File: example/html-nodes/index.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-3d/dist/react-force-graph-3d.js" defer></script>-->

  <style>
    .node-label {
      font-size: 12px;
      padding: 1px 4px;
      border-radius: 4px;
      background-color: rgba(0,0,0,0.5);
      user-select: none;
    }
  </style>
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraph3D from 'https://esm.sh/react-force-graph-3d?external=react';
    import React from 'react';
    import { createRoot } from 'react-dom';
    import { CSS2DRenderer, CSS2DObject } from 'https://esm.sh/three/examples/jsm/renderers/CSS2DRenderer.js';

    const extraRenderers = [new CSS2DRenderer()];

    fetch('../datasets/miserables.json').then(res => res.json()).then(data => {
      createRoot(document.getElementById('graph')).render(
        <ForceGraph3D
          extraRenderers={extraRenderers}
          graphData={data}
          nodeAutoColorBy="group"
          nodeThreeObject={node => {
            const nodeEl = document.createElement('div');
            nodeEl.textContent = node.id;
            nodeEl.style.color = node.color;
            nodeEl.className = 'node-label';
            return new CSS2DObject(nodeEl);
          }}
          nodeThreeObjectExtend={true}
        />
      );
    });
  </script>
</body>


================================================
File: example/img-nodes/index.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-3d/dist/react-force-graph-3d.js" defer></script>-->
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraph3D from 'https://esm.sh/react-force-graph-3d?external=react';
    import React from 'react';
    import { createRoot } from 'react-dom';
    import * as THREE from 'https://esm.sh/three';

    const imgs = ['cat.jpg', 'dog.jpg', 'eagle.jpg', 'elephant.jpg', 'grasshopper.jpg', 'octopus.jpg', 'owl.jpg', 'panda.jpg', 'squirrel.jpg', 'tiger.jpg', 'whale.jpg'];

    // Random connected graph
    const gData = {
      nodes: imgs.map((img, id) => ({ id, img })),
      links: [...Array(imgs.length).keys()]
        .filter(id => id)
          .map(id => ({
            source: id,
            target: Math.round(Math.random() * (id-1))
          }))
    };

    createRoot(document.getElementById('graph')).render(
      <ForceGraph3D
        graphData={gData}
        nodeThreeObject={({ img }) => {
          const imgTexture = new THREE.TextureLoader().load(`./imgs/${img}`);
          imgTexture.colorSpace = THREE.SRGBColorSpace;
          const material = new THREE.SpriteMaterial({ map: imgTexture });
          const sprite = new THREE.Sprite(material);
          sprite.scale.set(12, 12);

          return sprite;
        }}
      />
    );
  </script>
</body>



================================================
File: example/large-graph/index.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-3d/dist/react-force-graph-3d.js" defer></script>-->
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraph3D from 'https://esm.sh/react-force-graph-3d?external=react';
    import React from 'react';
    import { createRoot } from 'react-dom';

    fetch('../datasets/blocks.json').then(res => res.json()).then(data => {
      createRoot(document.getElementById('graph')).render(
        <ForceGraph3D
          graphData={data}
          nodeLabel={node => <div><b>{node.user}</b>: {node.description}</div>}
          nodeAutoColorBy="user"
          linkDirectionalParticles={1}
        />
      );
    });
  </script>
</body>


================================================
File: example/multi-selection/index.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-3d/dist/react-force-graph-3d.js" defer></script>-->
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraph3D from 'https://esm.sh/react-force-graph-3d?external=react';
    import React, { useMemo, useState, useCallback } from 'react';
    import { createRoot } from 'react-dom';
    import { genRandomTree } from '../datasets/random-data.js';

    const MultiSelectionGraph = () => {
      const data = useMemo(() => genRandomTree(40), []);
      const [selectedNodes, setSelectedNodes] = useState(new Set());

      return <ForceGraph3D
        graphData={data}
        nodeRelSize={9}
        nodeColor={useCallback(node => selectedNodes.has(node) ? 'yellow' : 'grey', [selectedNodes])}
        onNodeClick={useCallback((node, event) => {
          if (event.ctrlKey || event.shiftKey || event.altKey) { // multi-selection
            selectedNodes.has(node) ? selectedNodes.delete(node) : selectedNodes.add(node);
            setSelectedNodes(new Set(selectedNodes));
          } else { // single-selection
            const untoggle = selectedNodes.has(node) && selectedNodes.size === 1;
            selectedNodes.clear();
            !untoggle && selectedNodes.add(node);
          }
          setSelectedNodes(new Set(selectedNodes)); // update selected nodes state
        }, [selectedNodes])}
        onNodeDrag={useCallback((node, translate) => {
          if (selectedNodes.has(node)) { // moving a selected node
            [...selectedNodes]
              .filter(selNode => selNode !== node) // don't touch node being dragged
              .forEach(node => ['x', 'y', 'z'].forEach(coord => node[`f${coord}`] = node[coord] + translate[coord])); // translate other nodes by same amount
          }
        }, [selectedNodes])}
        onNodeDragEnd={useCallback(node => {
          if (selectedNodes.has(node)) { // finished moving a selected node
            [...selectedNodes]
              .filter(selNode => selNode !== node) // don't touch node being dragged
              .forEach(node => ['x', 'y', 'z'].forEach(coord => node[`f${coord}`] = undefined)); // unfix controlled nodes
          }
        }, [selectedNodes])}
      />;
    };

    createRoot(document.getElementById('graph'))
      .render(<MultiSelectionGraph />);
  </script>
</body>


================================================
File: example/text-links/index-3d.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-3d/dist/react-force-graph-3d.js" defer></script>-->
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraph3D from 'https://esm.sh/react-force-graph-3d?external=react';
    import React from 'react';
    import { createRoot } from 'react-dom';
    import SpriteText from "https://esm.sh/three-spritetext";

    fetch('../datasets/miserables.json').then(res => res.json()).then(data => {
      createRoot(document.getElementById('graph')).render(
        <ForceGraph3D
          graphData={data}
          nodeLabel="id"
          nodeAutoColorBy="group"
          linkThreeObjectExtend={true}
          linkThreeObject={link => {
            // extend link with text sprite
            const sprite = new SpriteText(`${link.source} > ${link.target}`);
            sprite.color = 'lightgrey';
            sprite.textHeight = 1.5;
            return sprite;
          }}
          linkPositionUpdate={(sprite, { start, end }) => {
            const middlePos = Object.assign(...['x', 'y', 'z'].map(c => ({
              [c]: start[c] + (end[c] - start[c]) / 2 // calc middle point
            })));

            // Position sprite
            Object.assign(sprite.position, middlePos);
          }}
        />
      );
    });
  </script>
</body>


================================================
File: example/text-nodes/index-2d.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-2d/dist/react-force-graph-2d.js" defer></script>-->
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraph2D from 'https://esm.sh/react-force-graph-2d?external=react';
    import React from 'react';
    import { createRoot } from 'react-dom';

    fetch('../datasets/miserables.json').then(res => res.json()).then(data => {
      createRoot(document.getElementById('graph')).render(
        <ForceGraph2D
          graphData={data}
          nodeAutoColorBy="group"
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.id;
            const fontSize = 12/globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = node.color;
            ctx.fillText(label, node.x, node.y);

            node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
          }}
          nodePointerAreaPaint={(node, color, ctx) => {
            ctx.fillStyle = color;
            const bckgDimensions = node.__bckgDimensions;
            bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
          }}
        />
      );
    });
  </script>
</body>


================================================
File: example/text-nodes/index-3d.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-3d/dist/react-force-graph-3d.js" defer></script>-->
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraph3D from 'https://esm.sh/react-force-graph-3d?external=react';
    import React from 'react';
    import { createRoot } from 'react-dom';
    import SpriteText from "https://esm.sh/three-spritetext";

    fetch('../datasets/miserables.json').then(res => res.json()).then(data => {
      createRoot(document.getElementById('graph')).render(
        <ForceGraph3D
          graphData={data}
          nodeAutoColorBy="group"
          nodeThreeObject={node => {
            const sprite = new SpriteText(node.id);
            sprite.color = node.color;
            sprite.textHeight = 8;
            return sprite;
          }}
        />
      );
    });
  </script>
</body>


================================================
File: example/tree/index.html
================================================
<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../src/packages/react-force-graph-2d/dist/react-force-graph-2d.js" defer></script>-->
</head>

<body>
  <div id="graph"></div>

  <script src="//cdn.jsdelivr.net/npm/@babel/standalone"></script>
  <script type="text/jsx" data-type="module">
    import ForceGraph2D from 'https://esm.sh/react-force-graph-2d?external=react';
    import React, { useState, useEffect, useRef } from 'react';
    import { createRoot } from 'react-dom';
    import { csvParse } from 'https://esm.sh/d3-dsv';
    import { forceCollide } from 'https://esm.sh/d3-force-3d';
    import { GUI } from 'https://esm.sh/dat.gui';

    const useForceUpdate = () => {
      const setToggle = useState(false)[1];
      return () => setToggle(b => !b);
    };

    const ForceTree = ({ data }) => {
      const fgRef = useRef();

      const [controls] = useState({ 'DAG Orientation': 'td'});
      const forceUpdate = useForceUpdate();

      useEffect(() => {
        // add controls GUI
        const gui = new GUI();
        gui.add(controls, 'DAG Orientation', ['td', 'bu', 'lr', 'rl', 'radialout', 'radialin', null])
          .onChange(forceUpdate);
      }, []);

      useEffect(() => {
        // add collision force
        fgRef.current.d3Force('collision', forceCollide(node => Math.sqrt(100 / (node.level + 1))));
      }, []);

      return <ForceGraph2D
        ref={fgRef}
        graphData={data}
        dagMode={controls['DAG Orientation']}
        dagLevelDistance={300}
        backgroundColor="#101020"
        linkColor={() => 'rgba(255,255,255,0.2)'}
        nodeRelSize={1}
        nodeId="path"
        nodeVal={node => 100 / (node.level + 1)}
        nodeLabel="path"
        nodeAutoColorBy="module"
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        d3VelocityDecay={0.3}
      />;
    };

    fetch('../datasets/d3-dependencies.csv')
      .then(r => r.text())
      .then(csvParse)
      .then(data => {
        const nodes = [], links = [];
        data.forEach(({ size, path }) => {
          const levels = path.split('/'),
            level = levels.length - 1,
            module = level > 0 ? levels[1] : null,
            leaf = levels.pop(),
            parent = levels.join('/');

          const node = {
            path,
            leaf,
            module,
            size: +size || 20,
            level
          };

          nodes.push(node);

          if (parent) {
            links.push({source: parent, target: path, targetNode: node});
          }
        });

        createRoot(document.getElementById('graph')).render(
          <ForceTree data={{ nodes, links }} />
        );
      });
  </script>
</body>


================================================
File: src/forcegraph-proptypes.js
================================================
import PropTypes from 'prop-types';

const commonPropTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  graphData: PropTypes.shape({
    nodes: PropTypes.arrayOf(PropTypes.object).isRequired,
    links: PropTypes.arrayOf(PropTypes.object).isRequired
  }),
  backgroundColor: PropTypes.string,
  nodeRelSize: PropTypes.number,
  nodeId: PropTypes.string,
  nodeLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  nodeVal: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.func]),
  nodeVisibility: PropTypes.oneOfType([PropTypes.bool, PropTypes.string, PropTypes.func]),
  nodeColor: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  nodeAutoColorBy: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  onNodeHover: PropTypes.func,
  onNodeClick: PropTypes.func,
  linkSource: PropTypes.string,
  linkTarget: PropTypes.string,
  linkLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  linkVisibility: PropTypes.oneOfType([PropTypes.bool, PropTypes.string, PropTypes.func]),
  linkColor: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  linkAutoColorBy: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  linkWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.func]),
  linkCurvature: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.func]),
  linkDirectionalArrowLength: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.func]),
  linkDirectionalArrowColor: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  linkDirectionalArrowRelPos: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.func]),
  linkDirectionalParticles: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.func]),
  linkDirectionalParticleSpeed: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.func]),
  linkDirectionalParticleWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.func]),
  linkDirectionalParticleColor: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  onLinkHover: PropTypes.func,
  onLinkClick: PropTypes.func,
  dagMode: PropTypes.oneOf(['td', 'bu', 'lr', 'rl', 'zin', 'zout', 'radialin', 'radialout']),
  dagLevelDistance: PropTypes.number,
  dagNodeFilter: PropTypes.func,
  onDagError: PropTypes.func,
  d3AlphaMin: PropTypes.number,
  d3AlphaDecay: PropTypes.number,
  d3VelocityDecay: PropTypes.number,
  warmupTicks: PropTypes.number,
  cooldownTicks: PropTypes.number,
  cooldownTime: PropTypes.number,
  onEngineTick: PropTypes.func,
  onEngineStop: PropTypes.func,
  getGraphBbox: PropTypes.func
};

const pointerBasedPropTypes = {
  zoomToFit: PropTypes.func,
  onNodeRightClick: PropTypes.func,
  onNodeDrag: PropTypes.func,
  onNodeDragEnd: PropTypes.func,
  onLinkRightClick: PropTypes.func,
  linkHoverPrecision: PropTypes.number,
  onBackgroundClick: PropTypes.func,
  onBackgroundRightClick: PropTypes.func,
  enablePointerInteraction: PropTypes.bool,
  enableNodeDrag: PropTypes.bool
};

const threeBasedPropTypes = {
  showNavInfo: PropTypes.bool,
  nodeOpacity: PropTypes.number,
  nodeResolution: PropTypes.number,
  nodeThreeObject: PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.func]),
  nodeThreeObjectExtend: PropTypes.oneOfType([PropTypes.bool, PropTypes.string, PropTypes.func]),
  linkOpacity: PropTypes.number,
  linkResolution: PropTypes.number,
  linkCurveRotation: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.func]),
  linkMaterial: PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.func]),
  linkThreeObject: PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.func]),
  linkThreeObjectExtend: PropTypes.oneOfType([PropTypes.bool, PropTypes.string, PropTypes.func]),
  linkPositionUpdate: PropTypes.func,
  linkDirectionalArrowResolution: PropTypes.number,
  linkDirectionalParticleResolution: PropTypes.number,
  forceEngine: PropTypes.oneOf(['d3', 'ngraph']),
  ngraphPhysics: PropTypes.object,
  numDimensions: PropTypes.oneOf([1, 2, 3])
};

export const ForceGraph2DPropTypes = Object.assign({},
  commonPropTypes,
  pointerBasedPropTypes,
  {
    linkLineDash: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.number), PropTypes.string, PropTypes.func]),
    nodeCanvasObjectMode: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    nodeCanvasObject: PropTypes.func,
    nodePointerAreaPaint: PropTypes.func,
    linkCanvasObjectMode: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    linkCanvasObject: PropTypes.func,
    linkPointerAreaPaint: PropTypes.func,
    autoPauseRedraw: PropTypes.bool,
    minZoom: PropTypes.number,
    maxZoom: PropTypes.number,
    enableZoomInteraction: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
    enablePanInteraction: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
    onZoom: PropTypes.func,
    onZoomEnd: PropTypes.func,
    onRenderFramePre: PropTypes.func,
    onRenderFramePost: PropTypes.func
  }
);

export const ForceGraph3DPropTypes = Object.assign({},
  commonPropTypes,
  pointerBasedPropTypes,
  threeBasedPropTypes,
  {
    enableNavigationControls: PropTypes.bool,
    controlType: PropTypes.oneOf(['trackball', 'orbit', 'fly']),
    rendererConfig: PropTypes.object,
    extraRenderers: PropTypes.arrayOf(PropTypes.shape({ render: PropTypes.func.isRequired }))
  }
);

export const ForceGraphVRPropTypes = Object.assign({},
  commonPropTypes,
  threeBasedPropTypes,
  {
    nodeDesc: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    linkDesc: PropTypes.oneOfType([PropTypes.string, PropTypes.func])
  }
);

export const ForceGraphARPropTypes = Object.assign({},
  commonPropTypes,
  threeBasedPropTypes,
  {
    markerAttrs: PropTypes.object,
    yOffset: PropTypes.number,
    glScale: PropTypes.number
  }
);



================================================
File: src/index.d.ts
================================================
export { default as ForceGraphVR } from './packages/react-force-graph-vr';
export { default as ForceGraphAR } from './packages/react-force-graph-ar';
export { default as ForceGraph3D } from './packages/react-force-graph-3d';
export { default as ForceGraph2D } from './packages/react-force-graph-2d';


================================================
File: src/index.js
================================================
// Load VR first to avoid three.js collisions
export { default as ForceGraphVR } from './packages/react-force-graph-vr/index.js';
export { default as ForceGraphAR } from './packages/react-force-graph-ar/index.js';
export { default as ForceGraph3D } from './packages/react-force-graph-3d/index.js';
export { default as ForceGraph2D } from './packages/react-force-graph-2d/index.js';


================================================
File: src/packages/react-force-graph-2d/index.d.ts
================================================
import * as React from 'react';
import ForceGraphKapsule from 'force-graph';

export interface GraphData<NodeType = {}, LinkType = {}> {
  nodes: NodeObject<NodeType>[];
  links: LinkObject<NodeType, LinkType>[];
}

export type NodeObject<NodeType = {}> = NodeType & {
  id?: string | number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
  [others: string]: any;
};

export type LinkObject<NodeType = {}, LinkType = {}> = LinkType & {
  source?: string | number | NodeObject<NodeType>;
  target?: string | number | NodeObject<NodeType>;
  [others: string]: any;
};

type Accessor<In, Out> = Out | string | ((obj: In) => Out);
type NodeAccessor<NodeType, T> = Accessor<NodeObject<NodeType>, T>;
type LinkAccessor<NodeType, LinkType, T> = Accessor<LinkObject<NodeType, LinkType>, T>;

type TooltipContent = string | React.ReactHTMLElement<HTMLElement>;

type CanvasCustomRenderMode = 'replace' | 'before' | 'after';
type CanvasCustomRenderFn<T> = (obj: T, canvasContext: CanvasRenderingContext2D, globalScale: number) => void;
type CanvasPointerAreaPaintFn<T> = (obj: T, paintColor: string, canvasContext: CanvasRenderingContext2D, globalScale: number) => void;

type DagMode = 'td' | 'bu' | 'lr' | 'rl' | 'radialout' | 'radialin';

interface ForceFn<NodeType = {}> {
  (alpha: number): void;
  initialize?: (nodes: NodeObject<NodeType>[], ...args: any[]) => void;
  [key: string]: any;
}

export interface ForceGraphProps<
  NodeType = {},
  LinkType = {}
> {
  // Data input
  graphData?: GraphData<NodeObject<NodeType>, LinkObject<NodeType, LinkType>>;
  nodeId?: string;
  linkSource?: string;
  linkTarget?: string;

  // Container layout
  width?: number;
  height?: number;
  backgroundColor?: string;

  // Node styling
  nodeRelSize?: number;
  nodeVal?: NodeAccessor<NodeType, number>;
  nodeLabel?: NodeAccessor<NodeType, TooltipContent>;
  nodeVisibility?: NodeAccessor<NodeType, boolean>;
  nodeColor?: NodeAccessor<NodeType, string>;
  nodeAutoColorBy?: NodeAccessor<NodeType, string | null>;
  nodeCanvasObjectMode?: string | ((obj: NodeObject<NodeType>) => CanvasCustomRenderMode | any);
  nodeCanvasObject?: CanvasCustomRenderFn<NodeObject<NodeType>>;
  nodePointerAreaPaint?: CanvasPointerAreaPaintFn<NodeObject<NodeType>>;

  // Link styling
  linkLabel?: LinkAccessor<NodeType, LinkType, TooltipContent>;
  linkVisibility?: LinkAccessor<NodeType, LinkType, boolean>;
  linkColor?: LinkAccessor<NodeType, LinkType, string>;
  linkAutoColorBy?: LinkAccessor<NodeType, LinkType, string | null>;
  linkLineDash?: LinkAccessor<NodeType, LinkType, number[] | null>;
  linkWidth?: LinkAccessor<NodeType, LinkType, number>;
  linkCurvature?: LinkAccessor<NodeType, LinkType, number>;
  linkCanvasObject?: CanvasCustomRenderFn<LinkObject<NodeType, LinkType>>;
  linkCanvasObjectMode?: string | ((obj: LinkObject<NodeType, LinkType>) => CanvasCustomRenderMode | any);
  linkDirectionalArrowLength?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalArrowColor?: LinkAccessor<NodeType, LinkType, string>;
  linkDirectionalArrowRelPos?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalParticles?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalParticleSpeed?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalParticleWidth?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalParticleColor?: LinkAccessor<NodeType, LinkType, string>;
  linkPointerAreaPaint?: CanvasPointerAreaPaintFn<LinkObject<NodeType, LinkType>>;

  // Render control
  autoPauseRedraw?: boolean;
  minZoom?: number;
  maxZoom?: number;
  onRenderFramePre?: (canvasContext: CanvasRenderingContext2D, globalScale: number) => void;
  onRenderFramePost?: (canvasContext: CanvasRenderingContext2D, globalScale: number) => void;

  // Force engine (d3-force) configuration
  dagMode?: DagMode;
  dagLevelDistance?: number | null;
  dagNodeFilter?: (node: NodeObject<NodeType>) => boolean;
  onDagError?: ((loopNodeIds: (string | number)[]) => void) | undefined;
  d3AlphaMin?: number;
  d3AlphaDecay?: number;
  d3VelocityDecay?: number;
  ngraphPhysics?: object;
  warmupTicks?: number;
  cooldownTicks?: number;
  cooldownTime?: number;
  onEngineTick?: () => void;
  onEngineStop?: () => void;

  // Interaction
  onNodeClick?: (node: NodeObject<NodeType>, event: MouseEvent) => void;
  onNodeRightClick?: (node: NodeObject<NodeType>, event: MouseEvent) => void;
  onNodeHover?: (node: NodeObject<NodeType> | null, previousNode: NodeObject<NodeType> | null) => void;
  onNodeDrag?: (node: NodeObject<NodeType>, translate: { x: number, y: number }) => void;
  onNodeDragEnd?: (node: NodeObject<NodeType>, translate: { x: number, y: number }) => void;
  onLinkClick?: (link: LinkObject<NodeType, LinkType>, event: MouseEvent) => void;
  onLinkRightClick?: (link: LinkObject<NodeType, LinkType>, event: MouseEvent) => void;
  onLinkHover?: (link: LinkObject<NodeType, LinkType> | null, previousLink: LinkObject<NodeType, LinkType> | null) => void;
  linkHoverPrecision?: number;
  onBackgroundClick?: (event: MouseEvent) => void;
  onBackgroundRightClick?: (event: MouseEvent) => void;
  onZoom?: (transform: {k: number, x: number, y: number}) => void;
  onZoomEnd?: (transform: {k: number, x: number, y: number}) => void;
  enableNodeDrag?: boolean;
  enableZoomInteraction?: boolean | ((event: MouseEvent) => boolean);
  enablePanInteraction?: boolean | ((event: MouseEvent) => boolean);
  enablePointerInteraction?: boolean;
}

export interface ForceGraphMethods<
  NodeType = {},
  LinkType = {}
> {
  // Link styling
  emitParticle(link: LinkObject<NodeType, LinkType>): ForceGraphKapsule;

  // Force engine (d3-force) configuration
  d3Force(forceName: 'link' | 'charge' | 'center' | string): ForceFn<NodeObject<NodeType>> | undefined;
  d3Force(forceName: 'link' | 'charge' | 'center' | string, forceFn: ForceFn<NodeObject<NodeType>> | null): ForceGraphKapsule;
  d3ReheatSimulation(): ForceGraphKapsule;

  // Render control
  pauseAnimation(): ForceGraphKapsule;
  resumeAnimation(): ForceGraphKapsule;
  centerAt(): {x: number, y: number};
  centerAt(x?: number, y?: number, durationMs?: number): ForceGraphKapsule;
  zoom(): number;
  zoom(scale: number, durationMs?: number): ForceGraphKapsule;
  zoomToFit(durationMs?: number, padding?: number, nodeFilter?: (node: NodeObject<NodeType>) => boolean): ForceGraphKapsule;

  // Utility
  getGraphBbox(nodeFilter?: (node: NodeObject<NodeType>) => boolean): { x: [number, number], y: [number, number] };
  screen2GraphCoords(x: number, y: number): { x: number, y: number };
  graph2ScreenCoords(x: number, y: number): { x: number, y: number };
}

type FCwithRef = <NodeType = {}, LinkType = {}>(props: ForceGraphProps<NodeObject<NodeType>, LinkObject<NodeType, LinkType>> & { ref?: React.MutableRefObject<ForceGraphMethods<NodeObject<NodeType>, LinkObject<NodeType, LinkType>> | undefined>; }) => React.ReactElement;

declare const ForceGraph: FCwithRef;

export default ForceGraph;



================================================
File: src/packages/react-force-graph-2d/index.js
================================================
import fromKapsule from 'react-kapsule';
import ForceGraph2DKapsule from 'force-graph';
import { ForceGraph2DPropTypes } from '../../forcegraph-proptypes';

const ForceGraph2D = fromKapsule(
  ForceGraph2DKapsule,
  {
    methodNames: [ // bind methods
      'emitParticle',
      'd3Force',
      'd3ReheatSimulation',
      'stopAnimation',
      'pauseAnimation',
      'resumeAnimation',
      'centerAt',
      'zoom',
      'zoomToFit',
      'getGraphBbox',
      'screen2GraphCoords',
      'graph2ScreenCoords'
    ]
  }
);

ForceGraph2D.displayName = 'ForceGraph2D';
ForceGraph2D.propTypes = ForceGraph2DPropTypes;

export default ForceGraph2D;



================================================
File: src/packages/react-force-graph-2d/rollup.config.dev.js
================================================
import buildConfig from './rollup.config.js';

// use first output of first config block for dev
const config = Array.isArray(buildConfig) ? buildConfig[0] : buildConfig;
Array.isArray(config.output) && (config.output = config.output[0]);

export default config;


================================================
File: src/packages/react-force-graph-2d/rollup.config.js
================================================
import resolve from '@rollup/plugin-node-resolve';
import commonJs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import babel from '@rollup/plugin-babel';
import terser from "@rollup/plugin-terser";
import dts from 'rollup-plugin-dts';

import pkg from './package.json' with { type: 'json' };
const { name, homepage, version, dependencies, peerDependencies } = pkg;

const umdConf = {
  format: 'umd',
  name: 'ForceGraph2D',
  globals: { react: 'React' },
  banner: `// Version ${version} ${name} - ${homepage}`
};

export default [
  {
    external: ['react'],
    input: 'index.js',
    output: [
      {
        ...umdConf,
        file: `dist/${name}.js`,
        sourcemap: true
      },
      { // minify
        ...umdConf,
        file: `dist/${name}.min.js`,
        plugins: [terser({
          output: { comments: '/Version/' }
        })]
      }
    ],
    plugins: [
      replace({ 'process.env.NODE_ENV': JSON.stringify('development') }), // To fool React in the browser
      resolve(),
      commonJs(),
      babel({ exclude: 'node_modules/**' })
    ]
  },
  { // ES module
    input: 'index.js',
    output: [
      {
        format: 'es',
        file: `dist/${name}.mjs`
      }
    ],
    external: [...Object.keys(dependencies), ...Object.keys(peerDependencies)],
    plugins: [
      babel()
    ]
  },
  { // expose TS declarations
    input: 'index.d.ts',
    output: [{
      file: `dist/${name}.d.ts`,
      format: 'es'
    }],
    plugins: [dts()]
  }
];


================================================
File: src/packages/react-force-graph-3d/index.d.ts
================================================
import * as React from 'react';
import { Light, Scene, Camera, WebGLRenderer, Object3D, Material } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { ConfigOptions, ForceGraph3DInstance as ForceGraphKapsuleInstance } from '3d-force-graph';

export interface GraphData<NodeType = {}, LinkType = {}> {
  nodes: NodeObject<NodeType>[];
  links: LinkObject<NodeType, LinkType>[];
}

export type NodeObject<NodeType = {}> = NodeType & {
  id?: string | number;
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number;
  fy?: number;
  fz?: number;
  [others: string]: any;
};

export type LinkObject<NodeType = {}, LinkType = {}> = LinkType & {
  source?: string | number | NodeObject<NodeType>;
  target?: string | number | NodeObject<NodeType>;
  [others: string]: any;
};

type Accessor<In, Out> = Out | string | ((obj: In) => Out);
type NodeAccessor<NodeType, T> = Accessor<NodeObject<NodeType>, T>;
type LinkAccessor<NodeType, LinkType, T> = Accessor<LinkObject<NodeType, LinkType>, T>;

type TooltipContent = string | React.ReactHTMLElement<HTMLElement>;

type DagMode = 'td' | 'bu' | 'lr' | 'rl' | 'zout' | 'zin' | 'radialout' | 'radialin';

type ForceEngine = 'd3' | 'ngraph';

interface ForceFn<NodeType = {}> {
  (alpha: number): void;
  initialize?: (nodes: NodeObject<NodeType>[], ...args: any[]) => void;
  [key: string]: any;
}

type Coords = { x: number; y: number; z: number; }

type LinkPositionUpdateFn = <NodeType = {}, LinkType = {}>(obj: Object3D, coords: { start: Coords, end: Coords }, link: LinkObject<NodeType, LinkType>) => void | null | boolean;

export interface ForceGraphProps<
  NodeType = {},
  LinkType = {}
> extends ConfigOptions {
  // Data input
  graphData?: GraphData<NodeObject<NodeType>, LinkObject<NodeType, LinkType>>;
  nodeId?: string;
  linkSource?: string;
  linkTarget?: string;

  // Container layout
  width?: number;
  height?: number;
  backgroundColor?: string;
  showNavInfo?: boolean;

  // Node styling
  nodeRelSize?: number;
  nodeVal?: NodeAccessor<NodeType, number>;
  nodeLabel?: NodeAccessor<NodeType, TooltipContent>;
  nodeVisibility?: NodeAccessor<NodeType, boolean>;
  nodeColor?: NodeAccessor<NodeType, string>;
  nodeAutoColorBy?: NodeAccessor<NodeType, string | null>;
  nodeOpacity?: number;
  nodeResolution?: number;
  nodeThreeObject?: NodeAccessor<NodeType, Object3D>;
  nodeThreeObjectExtend?: NodeAccessor<NodeType, boolean>;

  // Link styling
  linkLabel?: LinkAccessor<NodeType, LinkType, TooltipContent>;
  linkVisibility?: LinkAccessor<NodeType, LinkType, boolean>;
  linkColor?: LinkAccessor<NodeType, LinkType, string>;
  linkAutoColorBy?: LinkAccessor<NodeType, LinkType, string | null>;
  linkWidth?: LinkAccessor<NodeType, LinkType, number>;
  linkOpacity?: number;
  linkResolution?: number;
  linkCurvature?: LinkAccessor<NodeType, LinkType, number>;
  linkCurveRotation?: LinkAccessor<NodeType, LinkType, number>;
  linkMaterial?: LinkAccessor<NodeType, LinkType, Material | boolean | null>;
  linkThreeObject?: LinkAccessor<NodeType, LinkType, Object3D>;
  linkThreeObjectExtend?: LinkAccessor<NodeType, LinkType, boolean>;
  linkPositionUpdate?: LinkPositionUpdateFn | null;
  linkDirectionalArrowLength?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalArrowColor?: LinkAccessor<NodeType, LinkType, string>;
  linkDirectionalArrowRelPos?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalArrowResolution?: number;
  linkDirectionalParticles?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalParticleSpeed?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalParticleWidth?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalParticleColor?: LinkAccessor<NodeType, LinkType, string>;
  linkDirectionalParticleResolution?: number;

  // Force engine (d3-force) configuration
  forceEngine?: ForceEngine;
  numDimensions?: 1 | 2 | 3;
  dagMode?: DagMode;
  dagLevelDistance?: number | null;
  dagNodeFilter?: (node: NodeObject<NodeType>) => boolean;
  onDagError?: ((loopNodeIds: (string | number)[]) => void) | undefined;
  d3AlphaMin?: number;
  d3AlphaDecay?: number;
  d3VelocityDecay?: number;
  ngraphPhysics?: object;
  warmupTicks?: number;
  cooldownTicks?: number;
  cooldownTime?: number;
  onEngineTick?: () => void;
  onEngineStop?: () => void;

  // Interaction
  onNodeClick?: (node: NodeObject<NodeType>, event: MouseEvent) => void;
  onNodeRightClick?: (node: NodeObject<NodeType>, event: MouseEvent) => void;
  onNodeHover?: (node: NodeObject<NodeType> | null, previousNode: NodeObject<NodeType> | null) => void;
  onNodeDrag?: (node: NodeObject<NodeType>, translate: { x: number, y: number }) => void;
  onNodeDragEnd?: (node: NodeObject<NodeType>, translate: { x: number, y: number }) => void;
  onLinkClick?: (link: LinkObject<NodeType, LinkType>, event: MouseEvent) => void;
  onLinkRightClick?: (link: LinkObject<NodeType, LinkType>, event: MouseEvent) => void;
  onLinkHover?: (link: LinkObject<NodeType, LinkType> | null, previousLink: LinkObject<NodeType, LinkType> | null) => void;
  linkHoverPrecision?: number;
  onBackgroundClick?: (event: MouseEvent) => void;
  onBackgroundRightClick?: (event: MouseEvent) => void;
  enableNodeDrag?: boolean;
  enableNavigationControls?: boolean;
  enablePointerInteraction?: boolean;
}

export interface ForceGraphMethods<
  NodeType = {},
  LinkType = {}
> {
  // Link styling
  emitParticle(link: LinkObject<NodeType, LinkType>): ForceGraphKapsuleInstance;

  // Force engine (d3-force) configuration
  d3Force(forceName: 'link' | 'charge' | 'center' | string): ForceFn<NodeObject<NodeType>> | undefined;
  d3Force(forceName: 'link' | 'charge' | 'center' | string, forceFn: ForceFn<NodeObject<NodeType>> | null): ForceGraphKapsuleInstance;
  d3ReheatSimulation(): ForceGraphKapsuleInstance;

  // Render control
  pauseAnimation(): ForceGraphKapsuleInstance;
  resumeAnimation(): ForceGraphKapsuleInstance;
  cameraPosition(position: Partial<Coords>, lookAt?: Coords, transitionMs?: number): ForceGraphKapsuleInstance;
  zoomToFit(durationMs?: number, padding?: number, nodeFilter?: (node: NodeObject<NodeType>) => boolean): ForceGraphKapsuleInstance;
  postProcessingComposer(): EffectComposer;
  lights(): Light[];
  lights(lights: Light[]): ForceGraphKapsuleInstance;
  scene(): Scene;
  camera(): Camera;
  renderer(): WebGLRenderer;
  controls(): object;
  refresh(): ForceGraphKapsuleInstance;

  // Utility
  getGraphBbox(nodeFilter?: (node: NodeObject<NodeType>) => boolean): { x: [number, number], y: [number, number], z: [number, number] };
  screen2GraphCoords(x: number, y: number, distance: number): Coords;
  graph2ScreenCoords(x: number, y: number, z: number): Coords;
}

type FCwithRef = <NodeType = {}, LinkType = {}>(props: ForceGraphProps<NodeObject<NodeType>, LinkObject<NodeType, LinkType>> & { ref?: React.MutableRefObject<ForceGraphMethods<NodeObject<NodeType>, LinkObject<NodeType, LinkType>> | undefined>; }) => React.ReactElement;

declare const ForceGraph: FCwithRef;

export default ForceGraph;



================================================
File: src/packages/react-force-graph-3d/index.js
================================================
import fromKapsule from 'react-kapsule';
import ForceGraph3DKapsule from '3d-force-graph';
import { ForceGraph3DPropTypes } from '../../forcegraph-proptypes';

const ForceGraph3D = fromKapsule(
  ForceGraph3DKapsule,
  {
    methodNames: [ // bind methods
      'emitParticle',
      'd3Force',
      'd3ReheatSimulation',
      'stopAnimation',
      'pauseAnimation',
      'resumeAnimation',
      'cameraPosition',
      'zoomToFit',
      'getGraphBbox',
      'screen2GraphCoords',
      'graph2ScreenCoords',
      'postProcessingComposer',
      'lights',
      'scene',
      'camera',
      'renderer',
      'controls',
      'refresh'
    ],
    initPropNames: ['controlType', 'rendererConfig', 'extraRenderers']
  }
);

ForceGraph3D.displayName = 'ForceGraph3D';
ForceGraph3D.propTypes = ForceGraph3DPropTypes;

export default ForceGraph3D;



================================================
File: src/packages/react-force-graph-3d/rollup.config.dev.js
================================================
import buildConfig from './rollup.config.js';

// use first output of first config block for dev
const config = Array.isArray(buildConfig) ? buildConfig[0] : buildConfig;
Array.isArray(config.output) && (config.output = config.output[0]);

export default config;


================================================
File: src/packages/react-force-graph-3d/rollup.config.js
================================================
import resolve from '@rollup/plugin-node-resolve';
import commonJs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import babel from '@rollup/plugin-babel';
import terser from "@rollup/plugin-terser";
import dts from 'rollup-plugin-dts';

import pkg from './package.json' with { type: 'json' };
const { name, homepage, version, dependencies, peerDependencies } = pkg;

const umdConf = {
  format: 'umd',
  name: 'ForceGraph3D',
  globals: { react: 'React' },
  banner: `// Version ${version} ${name} - ${homepage}`
};

export default [
  {
    external: ['react'],
    input: 'index.js',
    output: [
      {
        ...umdConf,
        file: `dist/${name}.js`,
        sourcemap: true
      },
      { // minify
        ...umdConf,
        file: `dist/${name}.min.js`,
        plugins: [terser({
          output: { comments: '/Version/' }
        })]
      }
    ],
    plugins: [
      replace({ 'process.env.NODE_ENV': JSON.stringify('development') }), // To fool React in the browser
      resolve(),
      commonJs(),
      babel({ exclude: 'node_modules/**' })
    ]
  },
  { // ES module
    input: 'index.js',
    output: [
      {
        format: 'es',
        file: `dist/${name}.mjs`
      }
    ],
    external: [...Object.keys(dependencies), ...Object.keys(peerDependencies)],
    plugins: [
      babel()
    ]
  },
  { // expose TS declarations
    input: 'index.d.ts',
    output: [{
      file: `dist/${name}.d.ts`,
      format: 'es'
    }],
    plugins: [dts()]
  }
];


================================================
File: src/packages/react-force-graph-ar/index.d.ts
================================================
import * as React from 'react';
import { Object3D, Material } from 'three';
import { ConfigOptions, ForceGraphARInstance as ForceGraphKapsuleInstance } from '3d-force-graph-ar';

export interface GraphData<NodeType = {}, LinkType = {}> {
  nodes: NodeObject<NodeType>[];
  links: LinkObject<NodeType, LinkType>[];
}

export type NodeObject<NodeType = {}> = NodeType & {
  id?: string | number;
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number;
  fy?: number;
  fz?: number;
  [others: string]: any;
};

export type LinkObject<NodeType = {}, LinkType = {}> = LinkType & {
  source?: string | number | NodeObject<NodeType>;
  target?: string | number | NodeObject<NodeType>;
  [others: string]: any;
};

type Accessor<In, Out> = Out | string | ((obj: In) => Out);
type NodeAccessor<NodeType, T> = Accessor<NodeObject<NodeType>, T>;
type LinkAccessor<NodeType, LinkType, T> = Accessor<LinkObject<NodeType, LinkType>, T>;

type DagMode = 'td' | 'bu' | 'lr' | 'rl' | 'zout' | 'zin' | 'radialout' | 'radialin';

type ForceEngine = 'd3' | 'ngraph';

interface ForceFn<NodeType = {}> {
  (alpha: number): void;
  initialize?: (nodes: NodeObject<NodeType>[], ...args: any[]) => void;
  [key: string]: any;
}

type Coords = { x: number; y: number; z: number; }

type LinkPositionUpdateFn = <NodeType = {}, LinkType = {}>(obj: Object3D, coords: { start: Coords, end: Coords }, link: LinkObject<NodeType, LinkType>) => void | null | boolean;

export interface ForceGraphProps<
  NodeType = {},
  LinkType = {}
> extends ConfigOptions {
  // Data input
  graphData?: GraphData<NodeObject<NodeType>, LinkObject<NodeType, LinkType>>;
  nodeId?: string;
  linkSource?: string;
  linkTarget?: string;

  // Container layout
  width?: number;
  height?: number;
  backgroundColor?: string;
  showNavInfo?: boolean;

  // Node styling
  nodeRelSize?: number;
  nodeVal?: NodeAccessor<NodeType, number>;
  nodeVisibility?: NodeAccessor<NodeType, boolean>;
  nodeColor?: NodeAccessor<NodeType, string>;
  nodeAutoColorBy?: NodeAccessor<NodeType, string | null>;
  nodeOpacity?: number;
  nodeResolution?: number;
  nodeThreeObject?: NodeAccessor<NodeType, Object3D>;
  nodeThreeObjectExtend?: NodeAccessor<NodeType, boolean>;

  // Link styling
  linkVisibility?: LinkAccessor<NodeType, LinkType, boolean>;
  linkColor?: LinkAccessor<NodeType, LinkType, string>;
  linkAutoColorBy?: LinkAccessor<NodeType, LinkType, string | null>;
  linkWidth?: LinkAccessor<NodeType, LinkType, number>;
  linkOpacity?: number;
  linkResolution?: number;
  linkCurvature?: LinkAccessor<NodeType, LinkType, number>;
  linkCurveRotation?: LinkAccessor<NodeType, LinkType, number>;
  linkMaterial?: LinkAccessor<NodeType, LinkType, Material | boolean | null>;
  linkThreeObject?: LinkAccessor<NodeType, LinkType, Object3D>;
  linkThreeObjectExtend?: LinkAccessor<NodeType, LinkType, boolean>;
  linkPositionUpdate?: LinkPositionUpdateFn | null;
  linkDirectionalArrowLength?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalArrowColor?: LinkAccessor<NodeType, LinkType, string>;
  linkDirectionalArrowRelPos?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalArrowResolution?: number;
  linkDirectionalParticles?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalParticleSpeed?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalParticleWidth?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalParticleColor?: LinkAccessor<NodeType, LinkType, string>;
  linkDirectionalParticleResolution?: number;

  // Force engine (d3-force) configuration
  forceEngine?: ForceEngine;
  numDimensions?: 1 | 2 | 3;
  dagMode?: DagMode;
  dagLevelDistance?: number | null;
  dagNodeFilter?: (node: NodeObject<NodeType>) => boolean;
  onDagError?: ((loopNodeIds: (string | number)[]) => void) | undefined;
  d3AlphaMin?: number;
  d3AlphaDecay?: number;
  d3VelocityDecay?: number;
  ngraphPhysics?: object;
  warmupTicks?: number;
  cooldownTicks?: number;
  cooldownTime?: number;
  onEngineTick?: () => void;
  onEngineStop?: () => void;

  // Interaction
  onNodeHover?: (node: NodeObject<NodeType> | null, previousNode: NodeObject<NodeType> | null) => void;
  onNodeClick?: (link: LinkObject<NodeType, LinkType>) => void;
  onLinkHover?: (link: LinkObject<NodeType, LinkType> | null, previousLink: LinkObject<NodeType, LinkType> | null) => void;
  onLinkClick?: (link: LinkObject<NodeType, LinkType>) => void;
}

export interface ForceGraphMethods<
  NodeType = {},
  LinkType = {}
> {
  // Link styling
  emitParticle(link: LinkObject<NodeType, LinkType>): ForceGraphKapsuleInstance;

  // Force engine (d3-force) configuration
  d3Force(forceName: 'link' | 'charge' | 'center' | string): ForceFn<NodeObject<NodeType>> | undefined;
  d3Force(forceName: 'link' | 'charge' | 'center' | string, forceFn: ForceFn<NodeObject<NodeType>> | null): ForceGraphKapsuleInstance;
  d3ReheatSimulation(): ForceGraphKapsuleInstance;

  // Render control
  refresh(): ForceGraphKapsuleInstance;

  // Utility
  getGraphBbox(nodeFilter?: (node: NodeObject<NodeType>) => boolean): { x: [number, number], y: [number, number], z: [number, number] };
}

type FCwithRef = <NodeType = {}, LinkType = {}>(props: ForceGraphProps<NodeObject<NodeType>, LinkObject<NodeType, LinkType>> & { ref?: React.MutableRefObject<ForceGraphMethods<NodeObject<NodeType>, LinkObject<NodeType, LinkType>> | undefined>; }) => React.ReactElement;

declare const ForceGraph: FCwithRef;

export default ForceGraph;



================================================
File: src/packages/react-force-graph-ar/index.js
================================================
import fromKapsule from 'react-kapsule';
import ForceGraphARKapsule from '3d-force-graph-ar';
import { ForceGraphARPropTypes } from '../../forcegraph-proptypes';

const ForceGraphAR = fromKapsule(
  ForceGraphARKapsule,
  {
    methodNames: [ // bind methods
      'getGraphBbox',
      'emitParticle',
      'd3Force',
      'd3ReheatSimulation',
      'refresh'
    ],
    initPropNames: ['markerAttrs']
  }
);

ForceGraphAR.displayName = 'ForceGraphAR';
ForceGraphAR.propTypes = ForceGraphARPropTypes;

export default ForceGraphAR;



================================================
File: src/packages/react-force-graph-ar/rollup.config.dev.js
================================================
import buildConfig from './rollup.config.js';

// use first output of first config block for dev
const config = Array.isArray(buildConfig) ? buildConfig[0] : buildConfig;
Array.isArray(config.output) && (config.output = config.output[0]);

export default config;


================================================
File: src/packages/react-force-graph-ar/rollup.config.js
================================================
import resolve from '@rollup/plugin-node-resolve';
import commonJs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import babel from '@rollup/plugin-babel';
import terser from "@rollup/plugin-terser";
import dts from 'rollup-plugin-dts';

import pkg from './package.json' with { type: 'json' };
const { name, homepage, version, dependencies, peerDependencies } = pkg;

const umdConf = {
  format: 'umd',
  name: 'ForceGraphAR',
  globals: { react: 'React' },
  banner: `// Version ${version} ${name} - ${homepage}`
};

export default [
  {
    external: ['react'],
    input: 'index.js',
    output: [
      {
        ...umdConf,
        file: `dist/${name}.js`,
        sourcemap: true
      },
      { // minify
        ...umdConf,
        file: `dist/${name}.min.js`,
        plugins: [terser({
          output: { comments: '/Version/' }
        })]
      }
    ],
    plugins: [
      replace({ 'process.env.NODE_ENV': JSON.stringify('development') }), // To fool React in the browser
      resolve(),
      commonJs(),
      babel({ exclude: 'node_modules/**' })
    ]
  },
  { // ES module
    input: 'index.js',
    output: [
      {
        format: 'es',
        file: `dist/${name}.mjs`
      }
    ],
    external: [...Object.keys(dependencies), ...Object.keys(peerDependencies)],
    plugins: [
      babel()
    ]
  },
  { // expose TS declarations
    input: 'index.d.ts',
    output: [{
      file: `dist/${name}.d.ts`,
      format: 'es'
    }],
    plugins: [dts()]
  }
];


================================================
File: src/packages/react-force-graph-vr/index.d.ts
================================================
import * as React from 'react';
import { Object3D, Material } from 'three';
import { ConfigOptions, ForceGraphVRInstance as ForceGraphKapsuleInstance } from '3d-force-graph-vr';

export interface GraphData<NodeType = {}, LinkType = {}> {
  nodes: NodeObject<NodeType>[];
  links: LinkObject<NodeType, LinkType>[];
}

export type NodeObject<NodeType = {}> = NodeType & {
  id?: string | number;
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number;
  fy?: number;
  fz?: number;
  [others: string]: any;
};

export type LinkObject<NodeType = {}, LinkType = {}> = LinkType & {
  source?: string | number | NodeObject<NodeType>;
  target?: string | number | NodeObject<NodeType>;
  [others: string]: any;
};

type Accessor<In, Out> = Out | string | ((obj: In) => Out);
type NodeAccessor<NodeType, T> = Accessor<NodeObject<NodeType>, T>;
type LinkAccessor<NodeType, LinkType, T> = Accessor<LinkObject<NodeType, LinkType>, T>;

type DagMode = 'td' | 'bu' | 'lr' | 'rl' | 'zout' | 'zin' | 'radialout' | 'radialin';

type ForceEngine = 'd3' | 'ngraph';

interface ForceFn<NodeType = {}> {
  (alpha: number): void;
  initialize?: (nodes: NodeObject<NodeType>[], ...args: any[]) => void;
  [key: string]: any;
}

type Coords = { x: number; y: number; z: number; }

type LinkPositionUpdateFn = <NodeType = {}, LinkType = {}>(obj: Object3D, coords: { start: Coords, end: Coords }, link: LinkObject<NodeType, LinkType>) => void | null | boolean;

export interface ForceGraphProps<
  NodeType = {},
  LinkType = {}
> extends ConfigOptions {
  // Data input
  graphData?: GraphData<NodeObject<NodeType>, LinkObject<NodeType, LinkType>>;
  nodeId?: string;
  linkSource?: string;
  linkTarget?: string;

  // Container layout
  width?: number;
  height?: number;
  yOffset?: number;
  glScale?: number;

  // Node styling
  nodeLabel?: NodeAccessor<NodeType, string>;
  nodeDesc?: NodeAccessor<NodeType, string>;
  nodeRelSize?: number;
  nodeVal?: NodeAccessor<NodeType, number>;
  nodeVisibility?: NodeAccessor<NodeType, boolean>;
  nodeColor?: NodeAccessor<NodeType, string>;
  nodeAutoColorBy?: NodeAccessor<NodeType, string | null>;
  nodeOpacity?: number;
  nodeResolution?: number;
  nodeThreeObject?: NodeAccessor<NodeType, Object3D>;
  nodeThreeObjectExtend?: NodeAccessor<NodeType, boolean>;

  // Link styling
  linkLabel?: LinkAccessor<NodeType, LinkType, string>;
  linkDesc?: LinkAccessor<NodeType, LinkType, string>;
  linkVisibility?: LinkAccessor<NodeType, LinkType, boolean>;
  linkColor?: LinkAccessor<NodeType, LinkType, string>;
  linkAutoColorBy?: LinkAccessor<NodeType, LinkType, string | null>;
  linkWidth?: LinkAccessor<NodeType, LinkType, number>;
  linkOpacity?: number;
  linkResolution?: number;
  linkCurvature?: LinkAccessor<NodeType, LinkType, number>;
  linkCurveRotation?: LinkAccessor<NodeType, LinkType, number>;
  linkMaterial?: LinkAccessor<NodeType, LinkType, Material | boolean | null>;
  linkThreeObject?: LinkAccessor<NodeType, LinkType, Object3D>;
  linkThreeObjectExtend?: LinkAccessor<NodeType, LinkType, boolean>;
  linkPositionUpdate?: LinkPositionUpdateFn | null;
  linkDirectionalArrowLength?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalArrowColor?: LinkAccessor<NodeType, LinkType, string>;
  linkDirectionalArrowRelPos?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalArrowResolution?: number;
  linkDirectionalParticles?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalParticleSpeed?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalParticleWidth?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalParticleColor?: LinkAccessor<NodeType, LinkType, string>;
  linkDirectionalParticleResolution?: number;

  // Force engine (d3-force) configuration
  forceEngine?: ForceEngine;
  numDimensions?: 1 | 2 | 3;
  dagMode?: DagMode;
  dagLevelDistance?: number | null;
  dagNodeFilter?: (node: NodeObject<NodeType>) => boolean;
  onDagError?: ((loopNodeIds: (string | number)[]) => void) | undefined;
  d3AlphaMin?: number;
  d3AlphaDecay?: number;
  d3VelocityDecay?: number;
  ngraphPhysics?: object;
  warmupTicks?: number;
  cooldownTicks?: number;
  cooldownTime?: number;
  onEngineTick?: () => void;
  onEngineStop?: () => void;

  // Interaction
  onNodeHover?: (node: NodeObject<NodeType> | null, previousNode: NodeObject<NodeType> | null) => void;
  onNodeClick?: (link: LinkObject<NodeType, LinkType>) => void;
  onLinkHover?: (link: LinkObject<NodeType, LinkType> | null, previousLink: LinkObject<NodeType, LinkType> | null) => void;
  onLinkClick?: (link: LinkObject<NodeType, LinkType>) => void;
}

export interface ForceGraphMethods<
  NodeType = {},
  LinkType = {}
> {
  // Link styling
  emitParticle(link: LinkObject<NodeType, LinkType>): ForceGraphKapsuleInstance;

  // Force engine (d3-force) configuration
  d3Force(forceName: 'link' | 'charge' | 'center' | string): ForceFn<NodeObject<NodeType>> | undefined;
  d3Force(forceName: 'link' | 'charge' | 'center' | string, forceFn: ForceFn<NodeObject<NodeType>> | null): ForceGraphKapsuleInstance;
  d3ReheatSimulation(): ForceGraphKapsuleInstance;

  // Render control
  refresh(): ForceGraphKapsuleInstance;

  // Utility
  getGraphBbox(nodeFilter?: (node: NodeObject<NodeType>) => boolean): { x: [number, number], y: [number, number], z: [number, number] };
}

type FCwithRef = <NodeType = {}, LinkType = {}>(props: ForceGraphProps<NodeObject<NodeType>, LinkObject<NodeType, LinkType>> & { ref?: React.MutableRefObject<ForceGraphMethods<NodeObject<NodeType>, LinkObject<NodeType, LinkType>> | undefined>; }) => React.ReactElement;

declare const ForceGraph: FCwithRef;

export default ForceGraph;



================================================
File: src/packages/react-force-graph-vr/index.js
================================================
import fromKapsule from 'react-kapsule';
import ForceGraphVRKapsule from '3d-force-graph-vr';
import { ForceGraphVRPropTypes } from '../../forcegraph-proptypes';

const ForceGraphVR = fromKapsule(
  ForceGraphVRKapsule,
  {
    methodNames: [ // bind methods
      'getGraphBbox',
      'emitParticle',
      'd3Force',
      'd3ReheatSimulation',
      'refresh'
    ]
  }
);

ForceGraphVR.displayName = 'ForceGraphVR';
ForceGraphVR.propTypes = ForceGraphVRPropTypes;

export default ForceGraphVR;



================================================
File: src/packages/react-force-graph-vr/rollup.config.dev.js
================================================
import buildConfig from './rollup.config.js';

// use first output of first config block for dev
const config = Array.isArray(buildConfig) ? buildConfig[0] : buildConfig;
Array.isArray(config.output) && (config.output = config.output[0]);

export default config;


================================================
File: src/packages/react-force-graph-vr/rollup.config.js
================================================
import resolve from '@rollup/plugin-node-resolve';
import commonJs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import babel from '@rollup/plugin-babel';
import terser from "@rollup/plugin-terser";
import dts from 'rollup-plugin-dts';

import pkg from './package.json' with { type: 'json' };
const { name, homepage, version, dependencies, peerDependencies } = pkg;

const umdConf = {
  format: 'umd',
  name: 'ForceGraphVR',
  globals: { react: 'React' },
  banner: `// Version ${version} ${name} - ${homepage}`
};

export default [
  {
    external: ['react'],
    input: 'index.js',
    output: [
      {
        ...umdConf,
        file: `dist/${name}.js`,
        sourcemap: true
      },
      { // minify
        ...umdConf,
        file: `dist/${name}.min.js`,
        plugins: [terser({
          output: { comments: '/Version/' }
        })]
      }
    ],
    plugins: [
      replace({ 'process.env.NODE_ENV': JSON.stringify('development') }), // To fool React in the browser
      resolve(),
      commonJs(),
      babel({ exclude: 'node_modules/**' })
    ]
  },
  { // ES module
    input: 'index.js',
    output: [
      {
        format: 'es',
        file: `dist/${name}.mjs`
      }
    ],
    external: [...Object.keys(dependencies), ...Object.keys(peerDependencies)],
    plugins: [
      babel()
    ]
  },
  { // expose TS declarations
    input: 'index.d.ts',
    output: [{
      file: `dist/${name}.d.ts`,
      format: 'es'
    }],
    plugins: [dts()]
  }
];


================================================
File: .github/ISSUE_TEMPLATE/bug_report.md
================================================
---
name: Bug report
about: Create a report to help us improve
title: ''
labels: ''
assignees: ''

---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Desktop (please complete the following information):**
 - OS: [e.g. iOS]
 - Browser [e.g. chrome, safari]
 - Version [e.g. 22]

**Smartphone (please complete the following information):**
 - Device: [e.g. iPhone6]
 - OS: [e.g. iOS8.1]
 - Browser [e.g. stock browser, safari]
 - Version [e.g. 22]

**Additional context**
Add any other context about the problem here.



================================================
File: .github/ISSUE_TEMPLATE/feature_request.md
================================================
---
name: Feature request
about: Suggest an idea for this project
title: ''
labels: ''
assignees: ''

---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.


