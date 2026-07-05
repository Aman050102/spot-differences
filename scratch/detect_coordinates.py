import sys
import json
from PIL import Image

def find_circles(image_path, min_blue=150, max_other=100):
    img = Image.open(image_path)
    width, height = img.size
    print(f"Analyzing {image_path}: {width}x{height}")
    
    # Load image data
    pixels = img.load()
    
    # Find all blue pixels
    blue_pixels = []
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y][:3] # handle RGB/RGBA
            # Check for blue color: B is high, R and G are relatively low
            # The circle is bright blue, let's check for B > 200, R < 50, G < 150
            if b > min_blue and r < max_other and g < 150:
                blue_pixels.append((x, y))
                
    if not blue_pixels:
        print("No blue pixels found. Adjust thresholds.")
        return []
        
    print(f"Found {len(blue_pixels)} blue-ish pixels. Clustering...")
    
    # Simple DBSCAN/BFS clustering
    visited = set()
    clusters = []
    
    # Grid of blue pixels for O(1) lookup
    blue_set = set(blue_pixels)
    
    for px in blue_pixels:
        if px in visited:
            continue
            
        # Start a new cluster
        cluster = []
        queue = [px]
        visited.add(px)
        
        while queue:
            curr = queue.pop(0)
            cluster.append(curr)
            
            # Check 8 neighbors within a distance
            cx, cy = curr
            for dx in range(-4, 5):
                for dy in range(-4, 5):
                    neighbor = (cx + dx, cy + dy)
                    if neighbor in blue_set and neighbor not in visited:
                        visited.add(neighbor)
                        queue.append(neighbor)
                        
        # Filter out tiny noise clusters (e.g. less than 20 pixels)
        if len(cluster) > 30:
            clusters.append(cluster)
            
    print(f"Found {len(clusters)} clusters (potential circles).")
    
    results = []
    for i, cluster in enumerate(clusters):
        xs = [p[0] for p in cluster]
        ys = [p[1] for p in cluster]
        
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
        
        # Center is the midpoint of the bounding box
        cx = (min_x + max_x) / 2
        cy = (min_y + max_y) / 2
        
        # Radius is half the width or height of the bounding box
        rx = (max_x - min_x) / 2
        ry = (max_y - min_y) / 2
        r = max(rx, ry)
        
        # Convert to percentages relative to image dimensions
        px = (cx / width) * 100
        py = (cy / height) * 100
        pr = (r / width) * 100
        
        # Let's adjust r to make click detection user-friendly (e.g. minimum radius 3-5%)
        pr = max(pr, 4.0)
        
        results.append({
            "x": round(px, 1),
            "y": round(py, 1),
            "r": round(pr, 1)
        })
        
    # Sort results left to right, then top to bottom for consistent ordering
    results.sort(key=lambda item: (item['x'], item['y']))
    return results

if __name__ == "__main__":
    # Test answer_1
    print("--- LEVEL 1 ---")
    level1_circles = find_circles("assets/answer_1.png", min_blue=200, max_other=100)
    print(json.dumps(level1_circles, indent=2))
    
    print("\n--- LEVEL 2 ---")
    level2_circles = find_circles("assets/answer_2.png", min_blue=200, max_other=100)
    print(json.dumps(level2_circles, indent=2))
