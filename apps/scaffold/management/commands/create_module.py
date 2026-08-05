from pathlib import Path

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Cria um novo módulo do CFIT"

    def add_arguments(self, parser):
        parser.add_argument("name", type=str)

    def get_apps_path(self):
        return Path("apps")

    def get_templates_path(self):
        return Path("apps/scaffold/templates")

    def create_directory(self, path):
        path.mkdir(parents=True, exist_ok=True)

        init_file = path / "__init__.py"
        init_file.touch(exist_ok=True)

    def render_template(self, template_name, context):
        template_path = self.get_templates_path() / template_name
        content = template_path.read_text(encoding="utf-8")

        for key, value in context.items():
            content = content.replace(
                f"{{{{ {key} }}}}",
                value,
            )

        return content

    def write_template(self, template_name, destination, context):
        content = self.render_template(template_name, context)

        destination.write_text(
            content,
            encoding="utf-8",
        )

    def handle(self, *args, **options):
        module_name = options["name"].lower()
        class_name = module_name.rstrip("s").capitalize()
        variable_name = class_name.lower()

        module_path = self.get_apps_path() / module_name

        directories = [
            module_path,
            module_path / "api",
            module_path / "models",
            module_path / "repositories",
            module_path / "serializers",
            module_path / "selectors",
            module_path / "use_cases",
            module_path / "use_cases" / variable_name,
            module_path / "validators",
            module_path / "migrations",
            module_path / "tests",
        ]

        for directory in directories:
            self.create_directory(directory)

        context = {
            "module_name": module_name,
            "class_name": class_name,
            "variable_name": variable_name,
        }

        templates = {
            "apps.py.tpl": module_path / "apps.py",
            "admin.py.tpl": module_path / "admin.py",
            "constants.py.tpl": module_path / "constants.py",
            "model.py.tpl": (module_path / "models" / f"{variable_name}.py"),
            "repository.py.tpl": (
                module_path / "repositories" / f"{variable_name}_repository.py"
            ),
            "serializer.py.tpl": (
                module_path / "serializers" / f"{variable_name}_serializer.py"
            ),
            "api_urls.py.tpl": module_path / "api" / "urls.py",
            "api_views.py.tpl": module_path / "api" / "views.py",
        }

        for template_name, destination in templates.items():
            self.write_template(
                template_name,
                destination,
                context,
            )

        self.stdout.write(
            self.style.SUCCESS(f"Módulo '{module_name}' criado com sucesso!")
        )
