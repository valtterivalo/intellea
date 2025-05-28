from agents import function_tool
import umap # Assuming umap-learn is installed
import numpy as np

@function_tool
def calculate_positions(embeddings: list[list[float]], umap_params: dict | None = None) -> dict:
    """Calculate 2D positions for nodes using UMAP based on their embeddings."""
    if not embeddings:
        return {"nodes": []}

    # Default UMAP parameters, can be overridden by umap_params
    default_params = {
        'n_neighbors': 15,
        'min_dist': 0.1,
        'n_components': 2,
        'metric': 'cosine', # Common choice for text embeddings
        'random_state': 42 # for reproducibility
    }
    if umap_params:
        default_params.update(umap_params)

    reducer = umap.UMAP(**default_params)
    
    embedding_matrix = np.array(embeddings)
    
    # Ensure the matrix is 2D
    if embedding_matrix.ndim == 1:
        # This case might happen if only one embedding is passed
        # UMAP typically needs more than one point to be meaningful
        # Handle as appropriate, maybe return default positions or raise error
        # For now, let's assume we always get multiple embeddings
        pass 
        
    if embedding_matrix.shape[0] < default_params['n_neighbors']:
        # UMAP requires n_neighbors <= number of samples
        # Adjust n_neighbors or handle this case (e.g., return linear projection)
        reducer.set_params(n_neighbors=max(1, embedding_matrix.shape[0] -1)) # Example adjustment

    if embedding_matrix.shape[0] > 1:
        positions = reducer.fit_transform(embedding_matrix)
        # Scale positions to a reasonable range, e.g., [-1, 1] or [0, 1]
        # This depends on how the frontend expects the data
        # Example: basic min-max scaling
        pos_min = positions.min(axis=0)
        pos_max = positions.max(axis=0)
        if (pos_max - pos_min).all() > 0: # Avoid division by zero
            positions = (positions - pos_min) / (pos_max - pos_min)
        positions_list = positions.tolist()
    elif embedding_matrix.shape[0] == 1:
        # Handle single embedding case - place it at the center, for example
        positions_list = [[0.5, 0.5]]
    else:
        positions_list = []

    # Assuming the output format needed is a dict mapping node index (or ID) to position
    # Or maybe a list of nodes with positions, aligning with input embeddings
    # Returning a simple structure for now
    # The exact structure might need adjustment based on GraphInitOut/ExpandOut needs
    return {"positions": positions_list} # List of [x, y] coordinates 