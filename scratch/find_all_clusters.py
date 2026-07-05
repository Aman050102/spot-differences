from PIL import Image
import json

img = Image.open("assets/answer_1.png")
width, height = img.size
pixels = img.load()

# Find blue pixels
blue_pixels = []
for y in range(height):
    for x in range(width):
        r, g, b = pixels[x, y][:3]
        # Broaden the threshold to catch all circles
        if b > 150 and r < 100 and g < 150:
            blue_pixels.append((x, y))

# Cluster
visited = set()
clusters = []
blue_set = set(blue_pixels)

for px in blue_pixels:
    if px in visited:
        continue
    cluster = []
    queue = [px]
    visited.add(px)
    while queue:
        curr = queue.pop(0)
        cluster.append(curr)
        cx, cy = curr
        # 3px neighbor window to separate close circles
        for dx in range(-2, 3):
            for dy in range(-2, 3):
                neighbor = (cx + dx, cy + dy)
                if neighbor in blue_set and neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
                    
    if len(cluster) > 20: # ignore noise
        clusters.append(cluster)

print(f"Found {len(clusters)} clusters in answer_1.png:")
results = []
for i, cluster in enumerate(clusters):
    xs = [p[0] for p in cluster]
    ys = [p[1] for p in cluster]
    cx = sum(xs) / len(xs)
    cy = sum(ys) / len(ys)
    px = (cx / width) * 100
    py = (cy / height) * 100
    results.append({"x": round(px, 1), "y": round(py, 1), "r": 4.5})

results.sort(key=lambda item: (item['x'], item['y']))
print(json.dumps(results, indent=2))
