from flask import Flask, render_template, request
import json
from datetime import datetime
import os
from pathlib import Path

app = Flask(__name__)

# Конфигурация пути для сохранения данных
DATA_DIR = Path('quiz_data')
DATA_DIR.mkdir(exist_ok=True)  # Создаем папку, если ее нет


def save_to_json(data):
    """Сохраняет данные в JSON файл с уникальным именем"""
    try:
        # Создаем имя файла на основе текущего времени
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = DATA_DIR / f'quiz_result_{timestamp}.json'

        # Добавляем дополнительную информацию
        result_data = {
            'timestamp': datetime.now().isoformat(),
            'ip_address': request.remote_addr,
            'user_agent': request.user_agent.string,
            'quiz_data': data
        }

        # Сохраняем в файл
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(result_data, f, ensure_ascii=False, indent=2)

        return True
    except Exception as e:
        print(f"Ошибка при сохранении файла: {e}")
        return False


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/submit', methods=['POST'])
def submit():
    data = request.form.to_dict(flat=False)
    print("Полученные данные квиза:")

    # Обработка кастомных значений
    processed_data = {}
    for key, values in data.items():
        processed_values = []
        for value in values:
            if value.startswith('custom:'):
                processed_values.append(value[7:])
            else:
                processed_values.append(value)
        processed_data[key] = processed_values

    # Логирование в консоль
    print(processed_data)
    if 'custom_lifestyle' in processed_data:
        print('Свой вариант: \n', '1 вопрос. Какой образ жизни вам ближе всего? Ответ:',
              processed_data['custom_lifestyle'])
    if 'custom_conditions' in processed_data:
        print('Свой вариант: \n', '2 вопрос. Какие условия эксплуатации будущего автомобиля важны? Ответ:',
              processed_data['custom_conditions'])
    if 'custom_options' in processed_data:
        print('Свой вариант: \n', '4 вопрос. Какие опции в автомобиле вам интересны в первую очередь? Ответ:',
              processed_data['custom_options'])

    # Сохранение в JSON файл
    if not save_to_json(processed_data):
        return "Ошибка сохранения данных", 500

    # Возвращаем страницу благодарности
    return """
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Спасибо за участие!</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                min-height: 100vh;
                display: flex;
                justify-content: flex-start;
                align-items: flex-start;
                text-align: center;
                background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), 
                            url("/static/images/bg.png");
                background-size: cover;
                background-position: center;
                color: white;
                padding-top: 15vh;
            }
            .thank-you-container {
                max-width: 600px;
                padding: 30px;
                background-color: rgba(0, 0, 0, 0.7);
                border-radius: 10px;
                box-shadow: 0 5px 25px rgba(0,0,0,0.3);
                margin: 0 auto;
            }
            h1 {
                font-size: 2.2rem;
                margin-bottom: 15px;
                font-weight: bold;
            }
            p {
                font-size: 1.2rem;
                margin-bottom: 25px;
            }
            .official-site-btn {
                background-color: #007BFF;
                color: white;
                border: none;
                padding: 12px 25px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 1.1rem;
                font-weight: bold;
                transition: all 0.3s;
                text-decoration: none;
                display: inline-block;
            }
            .official-site-btn:hover {
                background-color: #0062cc;
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }
        </style>
    </head>
    <body>
        <div class="thank-you-container">
            <h1>Спасибо за ваш ответ!</h1>
            <p>Мы свяжемся с вами в ближайшее время для подбора наиболее подходящего кроссовера Peugeot.</p>
            <a href="https://peugeot-rus.ru/" class="official-site-btn" target="_blank">Посмотреть все автомобили в наличии на сайте</a>
        </div>
    </body>
    </html>
    """


if __name__ == '__main__':
    app.run(debug=True)