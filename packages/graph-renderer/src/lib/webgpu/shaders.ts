/**
 * @fileoverview WGSL shaders for WebGPU graph rendering.
 * Exports: shader code strings
 */

/**
 * Compute shader for spatial indexing (uniform grid construction).
 * Assigns each node to a grid cell based on its position.
 */
export const SPATIAL_INDEX_SHADER = `
struct Node {
  pos: vec3f,
  radius: f32,
}

struct GridCell {
  count: u32,
  start_index: u32,
}

@group(0) @binding(0) var<storage, read> nodes: array<Node>;
@group(0) @binding(1) var<storage, read_write> cell_counts: array<atomic<u32>>;
@group(0) @binding(2) var<storage, read_write> cell_indices: array<u32>;

struct Uniforms {
  grid_min: vec3f,
  grid_max: vec3f,
  grid_size: vec3u32,
  node_count: u32,
}

@group(0) @binding(3) var<uniform> uniforms: Uniforms;

@compute @workgroup_size(64)
fn spatial_index(@builtin(global_invocation_id) global_id: vec3u) {
  let node_idx = global_id.x;
  if (node_idx >= uniforms.node_count) {
    return;
  }

  let node = nodes[node_idx];
  let normalized_pos = (node.pos - uniforms.grid_min) / (uniforms.grid_max - uniforms.grid_min);
  let grid_pos = vec3u32(
    u32(normalized_pos.x * f32(uniforms.grid_size.x)),
    u32(normalized_pos.y * f32(uniforms.grid_size.y)),
    u32(normalized_pos.z * f32(uniforms.grid_size.z))
  );

  let cell_idx = grid_pos.x + grid_pos.y * uniforms.grid_size.x + grid_pos.z * uniforms.grid_size.x * uniforms.grid_size.y;
  let index = atomicAdd(&cell_counts[cell_idx], 1u);
  cell_indices[node_idx] = cell_idx;
}
`;

/**
 * Compute shader for frustum culling.
 * Marks nodes as visible if they intersect the view frustum.
 */
export const FRUSTUM_CULL_SHADER = `
struct Node {
  pos: vec3f,
  radius: f32,
}

struct Frustum {
  planes: array<vec4f, 6>,
}

@group(0) @binding(0) var<storage, read> nodes: array<Node>;
@group(0) @binding(1) var<storage, read_write> visible: array<u32>;
@group(0) @binding(2) var<uniform> frustum: Frustum;
@group(0) @binding(3) var<uniform> node_count: u32;

fn plane_distance(plane: vec4f, point: vec3f) -> f32 {
  return dot(plane.xyz, point) + plane.w;
}

@compute @workgroup_size(64)
fn frustum_cull(@builtin(global_invocation_id) global_id: vec3u) {
  let node_idx = global_id.x;
  if (node_idx >= node_count) {
    return;
  }

  let node = nodes[node_idx];
  let is_visible = true;

  for (var i = 0u; i < 6u; i++) {
    if (plane_distance(frustum.planes[i], node.pos) < -node.radius) {
      is_visible = false;
      break;
    }
  }

  visible[node_idx] = select(0u, 1u, is_visible);
}
`;

/**
 * Compute shader for level-of-detail calculation.
 * Assigns LOD level based on distance from camera.
 */
export const LOD_SHADER = `
struct Node {
  pos: vec3f,
  radius: f32,
}

@group(0) @binding(0) var<storage, read> nodes: array<Node>;
@group(0) @binding(1) var<storage, read_write> lod_levels: array<u32>;
@group(0) @binding(2) var<uniform> camera_pos: vec3f;
@group(0) @binding(3) var<uniform> node_count: u32;

@compute @workgroup_size(64)
fn calculate_lod(@builtin(global_invocation_id) global_id: vec3u) {
  let node_idx = global_id.x;
  if (node_idx >= node_count) {
    return;
  }

  let node = nodes[node_idx];
  let distance = length(node.pos - camera_pos);

  // LOD levels: 0 (highest detail) to 3 (lowest detail)
  // Distance thresholds: 0-100, 100-300, 300-600, 600+
  let lod_level = select(
    3u,
    select(
      2u,
      select(1u, 0u, distance < 100.0),
      distance < 300.0
    ),
    distance < 600.0
  );

  lod_levels[node_idx] = lod_level;
}
`;

/**
 * Vertex shader for node rendering with proper camera transforms.
 * Simplified point rendering for initial testing.
 */
export const NODE_VERTEX_SHADER = `
struct Uniforms {
  view_proj: mat4x4f,
  viewport: vec2f,
}

struct Node {
  pos: vec3f,
  radius: f32,
  color: vec4f,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> nodes: array<Node>;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
  @location(1) uv: vec2f,
}

@vertex
fn vertexMain(
  @builtin(vertex_index) vertex_index: u32,
  @builtin(instance_index) instance_index: u32
) -> VertexOutput {
  let node = nodes[instance_index];
  let quad = array<vec2f, 4>(
    vec2f(-1.0, -1.0),
    vec2f(1.0, -1.0),
    vec2f(-1.0, 1.0),
    vec2f(1.0, 1.0)
  );
  let offset = quad[vertex_index];
  let center = uniforms.view_proj * vec4f(node.pos, 1.0);
  let size = max(node.radius * 3.0, 4.0);
  let clip_offset = vec2f(
    offset.x * size * 2.0 / uniforms.viewport.x,
    offset.y * size * 2.0 / uniforms.viewport.y
  ) * center.w;

  var output: VertexOutput;
  output.position = vec4f(center.xy + clip_offset, center.zw);
  output.color = node.color;
  output.uv = offset * 0.5 + 0.5;

  return output;
}
`;

/**
 * Fragment shader for node rendering.
 */
export const NODE_FRAGMENT_SHADER = `
struct FragmentInput {
  @location(0) color: vec4f,
  @location(1) uv: vec2f,
}

@fragment
fn fragmentMain(input: FragmentInput) -> @location(0) vec4f {
  let distance_from_center = length(input.uv - vec2f(0.5, 0.5));
  if (distance_from_center > 0.5) {
    discard;
  }
  return input.color;
}
`;

/**
 * Vertex shader for link (edge) rendering with proper camera transforms.
 * Renders lines between nodes with thickness.
 */
export const LINK_VERTEX_SHADER = `
struct Uniforms {
  view_proj: mat4x4f,
  viewport: vec2f,
}

struct Link {
  source_pos: vec3f,
  target_pos: vec3f,
  color: vec4f,
  thickness: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> links: array<Link>;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
  @location(1) uv: vec2f,
}

@vertex
fn vertexMain(
  @builtin(vertex_index) vertex_index: u32,
  @builtin(instance_index) instance_index: u32
) -> VertexOutput {
  let link = links[instance_index];
  let source_clip = uniforms.view_proj * vec4f(link.source_pos, 1.0);
  let target_clip = uniforms.view_proj * vec4f(link.target_pos, 1.0);
  let source_ndc = source_clip.xy / source_clip.w;
  let target_ndc = target_clip.xy / target_clip.w;
  let direction = target_ndc - source_ndc;
  let direction_length = max(length(direction), 0.0001);
  let normal = vec2f(-direction.y, direction.x) / direction_length;
  let is_target = vertex_index >= 2u;
  let is_positive_side = vertex_index % 2u == 1u;
  let side = select(-1.0, 1.0, is_positive_side);
  let base = select(source_clip, target_clip, is_target);
  let uv_x = select(0.0, 1.0, is_target);
  let uv_y = select(0.0, 1.0, is_positive_side);
  let clip_offset = normal * side * link.thickness * base.w * 2.0 / uniforms.viewport;

  var output: VertexOutput;
  output.position = vec4f(base.xy + clip_offset, base.zw);
  output.color = link.color;
  output.uv = vec2f(uv_x, uv_y);

  return output;
}
`;

/**
 * Fragment shader for link rendering with rounded caps.
 */
export const LINK_FRAGMENT_SHADER = `
struct FragmentInput {
  @location(0) color: vec4f,
  @location(1) uv: vec2f,
}

@fragment
fn fragmentMain(input: FragmentInput) -> @location(0) vec4f {
  let dist = length(input.uv - vec2f(0.5, 0.5));
  let alpha = 1.0 - smoothstep(0.4, 0.5, dist);

  return vec4f(input.color.rgb, input.color.a * alpha);
}
`;
