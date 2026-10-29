# Local Model Directory

You can host your Teachable Machine model completely offline right here!

## How to use this folder:

1. Open your model project in [Teachable Machine](https://teachablemachine.withgoogle.com/).
2. Click **Export Model**.
3. Choose the **TensorFlow.js** tab.
4. Select **Download** (Export format: Model conversion to downloadable files).
5. Click **Download my model**. This gives you a `.zip` archive containing:
   - `model.json`
   - `metadata.json`
   - `weights.bin`
6. Unzip the downloaded file and place these three files directly inside this folder (`/model`):
   ```
   model/
   ├── model.json
   ├── metadata.json
   └── weights.bin
   ```
7. In the webapp UI, click **Hosted Local (`./model/`)** and click **Load Local Model**. The app will automatically fetch and run your local model without needing any internet connection!

