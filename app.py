from flask import Flask, request, jsonify
from flask_cors import CORS
from huggingface_hub import InferenceClient
import json
import re


# Initialize Flask app
app = Flask(__name__)
CORS(app)


# HuggingFace Configuration
HUGGINGFACE_API_KEY = "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"  # Replace with your actual API key
MISTRAL_MODEL = "mistralai/Mistral-7B-Instruct-v0.3"  # Change to your model's identifier


# Initialize HuggingFace client
hf_client = InferenceClient(api_key=HUGGINGFACE_API_KEY)


@app.route('/api/generate', methods=['POST'])
def generate_code():
    try:
        # Parse user input directly
        user_input = request.json
       
        # Validate input
        user_prompt = user_input.get("prompt")
        color_palette = user_input.get("colorPalette")
        sections_key_value = user_input.get("sectionsKeyValue", {})  # Get the key-value format


        if not user_prompt:
            return jsonify({'error': 'No prompt provided'}), 400


        if not color_palette or len(color_palette) < 1:
            return jsonify({'error': 'No color palette provided'}), 400


        print("Received color palette:", color_palette)
        print("Received sections key-value:", sections_key_value)


        # Create a formatted string of sections for the prompt
        sections_description = ""
        for label, content in sections_key_value.items():
            sections_description += f"\n- Section '{label}': Content = '{content}'"


        # Construct the system message with simplified section handling
        system_message = f"""
        You are a website code generator. Generate complete, valid HTML, CSS, and JavaScript code based on the user's requirements.
       
        The website should have these main sections which should be present in the body:{sections_description}
        However, additional sections should be added to enhance the website experience. Customize the nav bar too.


        Requirements:
        1. Create separate sections for each provided section label and render them exactly once
        2. Use the provided content for each section
        3. Ensure the sections are well-organized and styled appropriately
        4. Generate appropriate sample content for additional sections
        5. Use only the following colors from the provided color palette: {color_palette}
        6  Add catchy and creative headings, titles, etc. such that the website looks captivating.
        7. Make the UI sleek and fun.
        8. Create proper navigation to all sections
        9. Ensure responsive design for all screen sizes


        Format your response as valid JSON with three keys: 'html', 'css', and 'js', each containing their respective code as strings.
        Response format must be exactly:
        {{
        "code": {{
            "html": "<>Insert html code<>",
            "css": "body {{ insert css code }}",
            "js": "insert json code"
        }}
        }}
        """


        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": f"{user_prompt} - Please create a website with these requirements and incorporate all specified sections."}
        ]


        print("Sending request to HuggingFace API...")
        print("System message:", system_message)


        # Generate code using the HuggingFace client
        completion = hf_client.chat.completions.create(
            model=MISTRAL_MODEL,
            messages=messages,
            max_tokens=2000,
            temperature=0.7
        )


        # Get the response
        full_response = completion.choices[0].message.content
        print("Generated response from HuggingFace:", full_response)


        # Initialize HTML, CSS, and JS variables
        html_content = ""
        css_content = ""
        js_content = ""


        try:
            # Extract HTML content
            html_match = re.search(r'"html"\s*:\s*`(.*?)`', full_response, re.DOTALL)
            if html_match:
                html_content = html_match.group(1).strip()


            # Extract CSS content
            css_match = re.search(r'"css"\s*:\s*`(.*?)`', full_response, re.DOTALL)
            if css_match:
                css_content = css_match.group(1).strip()


            # Extract JS content
            js_match = re.search(r'"js"\s*:\s*`(.*?)`', full_response, re.DOTALL)
            if js_match:
                js_content = js_match.group(1).strip()


            # If no matches found, try parsing as JSON
            if not (html_content or css_content or js_content):
                try:
                    parsed_response = json.loads(full_response)
                    if 'code' in parsed_response:
                        code_parts = parsed_response['code']
                        html_content = code_parts.get('html', '')
                        css_content = code_parts.get('css', '')
                        js_content = code_parts.get('js', '')
                except json.JSONDecodeError:
                    print("Failed to parse response as JSON")


        except Exception as e:
            print("Error parsing content:", str(e))


        # Return the structured JSON response
        code_parts = {
            "html": html_content if html_content else "",
            "css": css_content if css_content else "",
            "js": js_content if js_content else ""
        }


        response_data = {
            'code': code_parts,
            'receivedPalette': color_palette,
            'sectionStructure': sections_key_value  # Include section structure in response
        }


        return jsonify(response_data)


    except Exception as e:
        print("Error in generate_code:", str(e))
        return jsonify({'error': f'Error: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
