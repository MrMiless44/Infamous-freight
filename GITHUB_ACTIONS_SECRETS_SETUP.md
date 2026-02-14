# Setting Up Secrets for CI/CD Pipelines

To set up secrets from the file located at `GITHUB_ACTIONS_SECRETS_SETUP.md`, you can follow these steps:

## Steps to Setup Secrets

1. **Open Your GitHub Repository**  
   Navigate to your GitHub repository: `MrMiless44/Infamous-freight`.  

2. **Access Repository Settings**  
   - Click on the `Settings` tab.

3. **Navigate to Secrets and Variables**  
   - On the left sidebar, click on `Secrets and variables`.
   - Select `Actions`.

4. **Add a New Secret**  
   - Click the `New repository secret` button.
   - In the form, add the name of the secret in the `Name` field (e.g., `MY_SECRET`).  
   - Copy the value from `GITHUB_ACTIONS_SECRETS_SETUP.md` and paste it into the `Value` field.
   - Click `Add secret` to save.

5. **Repeat for Additional Secrets**  
   - Repeat step 4 for each secret you need to add.

## CI/CD Pipeline Integration

Once your secrets are set up, you can reference them in your GitHub Actions workflows:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Use Secret
        run: echo "My secret is ${{ secrets.MY_SECRET }}"
```

Make sure to replace `MY_SECRET` with the actual secret names you added.

## Conclusion

After setting up the secrets, your CI/CD pipelines can securely access the sensitive information needed for deployment and testing.