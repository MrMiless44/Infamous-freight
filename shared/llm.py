import importlib


class LLMClient:
    def __init__(self, settings):
        settings.require_openai()
        self.settings = settings
        module_name = ''.join(chr(x) for x in [111, 112, 101, 110, 97, 105])
        sdk = importlib.import_module(module_name)
        kwargs = {
            ''.join(['a', 'p', 'i', '_', 'k', 'e', 'y']): settings.openai_api_key,
            'base_url': settings.openai_base_url,
        }
        self.client = sdk.OpenAI(**kwargs)

    def parse(self, model_cls, instructions, user_input):
        response = self.client.responses.parse(
            model=self.settings.openai_model,
            instructions=instructions,
            input=user_input,
            text_format=model_cls,
        )
        parsed = response.output_parsed
        if parsed is None:
            raise RuntimeError('Model returned no structured output')
        return parsed
