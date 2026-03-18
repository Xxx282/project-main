import csv
import random

input_file = "properties_modified.csv"
output_file = "properties_final.csv"

# City price ranges (monthly rent in CNY)
CITY_PRICE_RANGES = {
    "Shanghai": {"min": 3000, "max": 30000},
    "Beijing": {"min": 2500, "max": 25000},
    "Shenzhen": {"min": 2500, "max": 20000},
    "Guangzhou": {"min": 2000, "max": 15000},
    "Hangzhou": {"min": 2000, "max": 15000},
    "Chengdu": {"min": 1500, "max": 10000},
    "Wuhan": {"min": 1200, "max": 8000},
    "Xi'an": {"min": 1000, "max": 7000},
    "Nanjing": {"min": 1800, "max": 12000},
    "Chongqing": {"min": 1200, "max": 8000},
}

def get_reasonable_price(city, area, bedrooms):
    base = CITY_PRICE_RANGES.get(city, {"min": 1500, "max": 8000})
    area_factor = min(max(area / 100, 0.3), 3)
    bedroom_factor = 1 + (bedrooms - 1) * 0.15
    random_factor = random.uniform(0.7, 1.3)
    price = ((base["min"] + base["max"]) / 2) * area_factor * bedroom_factor * random_factor
    return round(max(base["min"], min(price, base["max"])), 2)

def get_reasonable_area(bedrooms):
    base_area = {
        1: (35, 80),
        2: (60, 120),
        3: (90, 180),
        4: (130, 250),
        5: (160, 300),
    }
    areas = base_area.get(bedrooms, (50, 150))
    return round(random.uniform(areas[0], areas[1]), 2)

with open(input_file, 'r', encoding='utf-8', newline='') as infile:
    reader = csv.reader(infile)
    rows = list(reader)

header = rows[0]

idx_id = header.index("id")
idx_city = header.index("city")
idx_bedrooms = header.index("bedrooms")
idx_area = header.index("area")
idx_price = header.index("price")
idx_total_floors = header.index("total_floors")
idx_decoration = header.index("decoration")

decorations = ["simple", "luxury", "rough", "fine"]

# Re-assign IDs starting from 1
new_id = 1
for row in rows[1:]:
    bedrooms = int(float(row[idx_bedrooms]))
    city = row[idx_city]

    # New ID
    row[idx_id] = new_id

    # Reasonable area
    new_area = get_reasonable_area(bedrooms)
    row[idx_area] = new_area

    # Recalculate price
    new_price = get_reasonable_price(city, new_area, bedrooms)
    row[idx_price] = new_price

    # Random total_floors (1-30)
    row[idx_total_floors] = random.randint(1, 30)

    # Random decoration
    row[idx_decoration] = random.choice(decorations)

    new_id += 1

with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
    writer = csv.writer(outfile)
    writer.writerows(rows)

print(f"Re-assigned IDs from 1 to {new_id - 1}")
print(f"Output: {output_file}")

print("\n--- Sample (first 5 rows) ---")
for row in rows[1:6]:
    print(f"ID:{row[idx_id]}, City:{row[idx_city]}, BR:{row[idx_bedrooms]}, Area:{row[idx_area]}, Price:{row[idx_price]}, Floor:{row[idx_total_floors]}, Dec:{row[idx_decoration]}")
