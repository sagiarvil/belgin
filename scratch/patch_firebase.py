import sys, json

def patch():
    file_path = '/Users/macair1/projects/belgin/firebase.json'
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    rewrites = data.get('hosting', {}).get('rewrites', [])
    
    # Check if already exists
    for rw in rewrites:
        if rw.get('source') == '/api/payment/cancel-vip':
            print("Already patched firebase.json")
            return

    # Find the index of createPayment
    idx = -1
    for i, rw in enumerate(rewrites):
        if rw.get('function') == 'createPayment':
            idx = i
            break

    new_rule = {
        "source": "/api/payment/cancel-vip",
        "function": "cancelVipLink"
    }

    if idx != -1:
        rewrites.insert(idx + 1, new_rule)
    else:
        rewrites.insert(0, new_rule)

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("Patched firebase.json successfully.")

patch()
