import csv
import random

# 读取原始数据
input_file = 'rent-price-ml/data/house_rent.csv'
output_file = 'rent-price-ml/data/house_rent_cleaned.csv'

# 各城市区域价格基准（每月租金 元/月）
CITY_BASE_PRICE = {
    'Beijing': {'base': 80, 'high': 150},
    'Shanghai': {'base': 80, 'high': 140},
    'Guangzhou': {'base': 50, 'high': 90},
    'Shenzhen': {'base': 60, 'high': 110},
    'Hangzhou': {'base': 50, 'high': 100},
    'Nanjing': {'base': 40, 'high': 80},
    'Chengdu': {'base': 35, 'high': 70},
    'Chongqing': {'base': 30, 'high': 60},
    'Wuhan': {'base': 35, 'high': 70},
    'Xi\'an': {'base': 30, 'high': 60},
}

# 每平方米价格范围（根据城市和装修情况）
DECORATION_MULTIPLIER = {
    'rough': 1.0,    # 毛坯
    'simple': 1.2,   # 简单装修
    'fine': 1.5,     # 精装修
    'luxury': 2.0,  # 豪华装修
}

# 户型基准面积（平方米）
LAYOUT_AREA = {
    1: (40, 70),
    2: (60, 100),
    3: (90, 150),
    4: (120, 200),
    5: (150, 250),
    6: (180, 300),
}

# 卫生间数量基准
BEDROOMS_TO_BATHROOMS = {
    1: 1,
    2: 1,
    3: 1,
    4: 2,
    5: 2,
    6: 2,
}

# 标题模板（英文）
TITLE_TEMPLATES = [
    'Exquisite {region} Apartment',
    '{city}{region} Cozy Home',
    '{region} Comfortable 2BR',
    'For Rent: {region} Fine Decorated',
    '{city} {region} Metro Station Nearby',
    '{region} South-North Facing',
    '{region} Move-in Ready Apartment',
    'For Rent: {region} School District',
]

ORIENTATIONS = ['north', 'south', 'east', 'west']
DECORATIONS = ['rough', 'simple', 'fine', 'luxury']

def generate_realistic_data(row):
    city = row['city']
    bedrooms = int(row['bedrooms'])
    decoration = row['decoration']
    orientation = random.choice(ORIENTATIONS)
    
    # 确保 decoration 是有效值
    if decoration not in DECORATION_MULTIPLIER:
        decoration = random.choice(DECORATIONS)
    
    # 获取城市基准价格
    city_info = CITY_BASE_PRICE.get(city, {'base': 50, 'high': 80})
    
    # 根据户型获取面积范围
    area_range = LAYOUT_AREA.get(bedrooms, (60, 120))
    # 添加一些随机变化
    area = random.randint(int(area_range[0] * 0.8), int(area_range[1] * 1.2))
    
    # 计算价格：基准价 * 面积 * 装修系数 * 随机系数
    base_price = random.uniform(city_info['base'], city_info['high'])
    decoration_mult = DECORATION_MULTIPLIER[decoration]
    random_factor = random.uniform(0.8, 1.3)
    price = int(area * base_price * decoration_mult * random_factor)
    
    # 确保价格合理范围
    price = max(800, min(price, 30000))
    
    # 卫生间数量
    bathrooms = BEDROOMS_TO_BATHROOMS.get(bedrooms, 1)
    # 偶尔增加卫生间
    if random.random() > 0.7:
        bathrooms += 1
    
    # 总楼层（随机 1-35 层）
    total_floors = random.randint(6, 35)
    
    # 生成标题
    region = row['region']
    title = random.choice(TITLE_TEMPLATES).format(city=city, region=region)
    
    # 更新行数据
    row['title'] = title
    row['area'] = area
    row['price'] = price
    row['bathrooms'] = bathrooms
    row['total_floors'] = total_floors
    row['orientation'] = orientation
    row['description'] = f'{bedrooms} bedroom(s), {bathrooms} bathroom(s), {area} sqm, {decoration} decoration, {orientation} facing, move-in ready.'
    
    return row

# 读取并处理数据
print('开始清理数据...')

with open(input_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

print(f'原始数据: {len(rows)} 条')

# 处理每条数据
new_rows = []
for i, row in enumerate(rows):
    try:
        new_row = generate_realistic_data(row)
        new_rows.append(new_row)
    except Exception as e:
        print(f'处理第 {i+1} 行时出错: {e}')
        new_rows.append(row)

print(f'处理完成: {len(new_rows)} 条')

# 写入新数据
with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(new_rows)

print(f'已保存到: {output_file}')

# 显示一些统计信息
areas = [int(r['area']) for r in new_rows]
prices = [int(r['price']) for r in new_rows]
print(f'\n面积统计: 最小 {min(areas)}, 最大 {max(areas)}, 平均 {sum(areas)//len(areas)} 平米')
print(f'价格统计: 最小 {min(prices)}, 最大 {max(prices)}, 平均 {sum(prices)//len(prices)} 元/月')
