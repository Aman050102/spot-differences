from PIL import Image
import json

img_ans = Image.open("assets/answer_1.png")
img_game = Image.open("assets/game_1.png")
width, height = img_ans.size

pix_ans = img_ans.load()
pix_game = img_game.load()

changed_pixels = []
for y in range(height):
    for x in range(width):
        r_a, g_a, b_a = pix_ans[x, y][:3]
        r_g, g_g, b_g = pix_game[x, y][:3]
        
        # Absolute difference in any channel
        if abs(r_a - r_g) > 30 or abs(g_a - g_g) > 30 or abs(b_a - b_g) > 30:
            changed_pixels.append((x, y))

print(f"Total changed pixels: {len(changed_pixels)}")

# Cluster
visited = set()
clusters = []
changed_set = set(changed_pixels)

for px in changed_pixels:
    if px in visited:
        continue
    cluster = []
    queue = [px]
    visited.add(px)
    while queue:
        curr = queue.pop(0)
        cluster.append(curr)
        cx, cy = curr
        for dx in range(-4, 5):
            for dy in range(-4, 5):
                neighbor = (cx + dx, cy + dy)
                if neighbor in changed_set and neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
                    
    if len(cluster) > 50:
        clusters.append(cluster)

print(f"Found {len(clusters)} changed clusters:")
results = []
for i, cluster in enumerate(clusters):
    xs = [p[0] for p in cluster]
    ys = [p[1] for p in cluster]
    cx = sum(xs) / len(xs)
    cy = sum(ys) / len(ys)
    px = (cx / width) * 100
    py = (cy / height) * 100
    results.append({"x": round(px, 1), "y": round(py, 1)})

results.sort(key=lambda item: (item['x'], item['y']))
print(json.dumps(results, indent=2))
