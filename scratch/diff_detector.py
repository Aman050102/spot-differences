import sys
import json
from PIL import Image

def find_circles_by_diff(answer_path, game_path, min_diff=100):
    img_ans = Image.open(answer_path)
    img_game = Image.open(game_path)
    
    if img_ans.size != img_game.size:
        print(f"Dimension mismatch: {img_ans.size} vs {img_game.size}")
        return []
        
    width, height = img_ans.size
    print(f"Comparing {answer_path} and {game_path}: {width}x{height}")
    
    pix_ans = img_ans.load()
    pix_game = img_game.load()
    
    # Find pixels with high difference, particularly where answer is blue
    diff_pixels = []
    for y in range(height):
        for x in range(width):
            r_a, g_a, b_a = pix_ans[x, y][:3]
            r_g, g_g, b_g = pix_game[x, y][:3]
            
            # The circle is blue, so we expect a high difference in RGB, especially in blue
            # Let's check if the pixel in the answer is blue: b_a > 180, r_a < 80, g_a < 150
            # And it should be different from the game image
            is_blue_circle = (b_a > 180 and r_a < 100 and g_a < 180)
            has_diff = abs(r_a - r_g) > 30 or abs(g_a - g_g) > 30 or abs(b_a - b_g) > 30
            
            if is_blue_circle and has_diff:
                diff_pixels.append((x, y))
                
    if not diff_pixels:
        print("No difference pixels found. Adjust thresholds.")
        return []
        
    print(f"Found {len(diff_pixels)} matching difference pixels. Clustering...")
    
    # Cluster pixels
    visited = set()
    clusters = []
    diff_set = set(diff_pixels)
    
    for px in diff_pixels:
        if px in visited:
            continue
            
        cluster = []
        queue = [px]
        visited.add(px)
        
        while queue:
            curr = queue.pop(0)
            cluster.append(curr)
            
            cx, cy = curr
            # search neighbors in a 2px window
            for dx in range(-2, 3):
                for dy in range(-2, 3):
                    neighbor = (cx + dx, cy + dy)
                    if neighbor in diff_set and neighbor not in visited:
                        visited.add(neighbor)
                        queue.append(neighbor)
                        
        if len(cluster) > 30: # ignore small noise
            clusters.append(cluster)
            
    print(f"Found {len(clusters)} clusters.")
    
    results = []
    for i, cluster in enumerate(clusters):
        xs = [p[0] for p in cluster]
        ys = [p[1] for p in cluster]
        
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
        
        cx = (min_x + max_x) / 2
        cy = (min_y + max_y) / 2
        
        rx = (max_x - min_x) / 2
        ry = (max_y - min_y) / 2
        r = max(rx, ry)
        
        px = (cx / width) * 100
        py = (cy / height) * 100
        pr = (r / width) * 100
        
        # enforce minimum radius for gameplay comfort
        pr = max(pr, 4.5)
        
        results.append({
            "x": round(px, 1),
            "y": round(py, 1),
            "r": round(pr, 1)
        })
        
    results.sort(key=lambda item: (item['x'], item['y']))
    return results

if __name__ == "__main__":
    print("--- LEVEL 1 (Elephant Battle) ---")
    lvl1 = find_circles_by_diff("assets/answer_1.png", "assets/game_1.png")
    print(json.dumps(lvl1, indent=2))
    
    print("\n--- LEVEL 2 (Forest Boats) ---")
    lvl2 = find_circles_by_diff("assets/answer_2.png", "assets/game_2.png")
    print(json.dumps(lvl2, indent=2))
