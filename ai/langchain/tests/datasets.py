from langsmith import Client

client = Client()

dataset = client.create_dataset(dataset_name="test-dataset", description="Test dataset")

examples = [
    {
        # The graph expects an input dict with a string under "messages"
        "inputs": {"messages": "Lasagna"},
        "outputs": {
            # Use OpenAI-style message dicts: role/content
            "messages": [
                {
                    "role": "assistant",
                    "content": "['ground beef (500g)', 'onion', 'garlic (3 cloves)', 'carrots', 'celery', 'tomato paste', 'tomato sauce (1L)', 'lasagna noodles', 'bechamel sauce (1L)', 'milk (1L)', 'butter', 'parmesan', 'eggs (4)', 'salt', 'black pepper', 'nutmeg', 'mozzarella (1kg)']",
                }
            ]
        },
    }
]
 
client.create_examples(dataset_id=dataset.id, examples=examples)
