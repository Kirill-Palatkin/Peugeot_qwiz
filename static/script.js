document.addEventListener('DOMContentLoaded', function() {
  // Добавляем кнопку в info-content
  const infoContent = document.querySelector('.info-content');
  if (infoContent) {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '60px';
    buttonContainer.style.textAlign = 'center';

    const ctaButton = document.createElement('button');
    ctaButton.className = 'cta-button';
    ctaButton.textContent = 'Подобрать кроссовер';

    buttonContainer.appendChild(ctaButton);
    infoContent.appendChild(buttonContainer);

    ctaButton.addEventListener('click', function() {
      document.querySelector('.quiz-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  }

  // Инициализация квиза
  let questions, nextBtn, backBtn, quizForm, currentQuestion, progressBar;

  function initQuiz() {
    questions = document.querySelectorAll('.question');
    nextBtn = document.getElementById('next-btn');
    backBtn = document.getElementById('back-btn');
    quizForm = document.querySelector('form');
    currentQuestion = 0;

    // Progress Bar
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    progressContainer.innerHTML = '<div class="progress-bar" id="progress"></div>';
    document.querySelector('.container').insertBefore(progressContainer, document.querySelector('.container').firstChild);
    progressBar = document.getElementById('progress');

    // Инициализация полей для "Свой вариант"
    initCustomInputs();

    showQuestion(0);
    nextBtn.addEventListener('click', handleNextQuestion);
    backBtn.addEventListener('click', handlePreviousQuestion);
  }

  function initCustomInputs() {
    // Добавляем контейнеры для ввода и обработчики событий
    document.querySelectorAll('input[type="checkbox"][value="custom"]').forEach(checkbox => {
      const container = document.createElement('div');
      container.className = 'custom-input-container';
      container.style.display = 'none';
      container.style.marginTop = '10px';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'custom-input';
      input.placeholder = 'Укажите ваш вариант';
      input.dataset.for = checkbox.name;

      container.appendChild(input);
      checkbox.parentNode.after(container);

      checkbox.addEventListener('change', function() {
        if (this.checked) {
          container.style.display = 'block';
        } else {
          container.style.display = 'none';
          input.value = '';
        }
      });
    });
  }

  function showQuestion(index) {
    questions.forEach((question, i) => {
      question.style.display = i === index ? 'block' : 'none';
    });

    backBtn.style.display = index === 0 ? 'none' : 'block';
    updateProgress();
    updateButtonText();
  }

  function updateProgress() {
    const progressPercentage = ((currentQuestion + 1) / questions.length) * 100;
    progressBar.style.width = `${progressPercentage}%`;
  }

  function updateButtonText() {
    nextBtn.textContent = currentQuestion === questions.length - 1 ? 'Отправить' : 'Далее';
  }

  function handleNextQuestion() {
    if (!validateCurrentQuestion()) return;

    // Собираем кастомные значения перед переходом
    collectCustomInputs();

    questions[currentQuestion].style.display = 'none';
    currentQuestion++;

    if (currentQuestion < questions.length) {
      showQuestion(currentQuestion);
    } else {
      quizForm.submit();
    }
  }

  function collectCustomInputs() {
    // Удаляем старые скрытые поля (если есть)
    document.querySelectorAll('input[type="hidden"][name^="custom_"]').forEach(el => el.remove());

    // Добавляем скрытые поля с кастомными значениями
    document.querySelectorAll('.custom-input').forEach(input => {
      if (input.value.trim() && input.closest('.custom-input-container').style.display === 'block') {
        const name = input.dataset.for;
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = `custom_${name}`;
        hiddenInput.value = input.value;
        quizForm.appendChild(hiddenInput);
      }
    });
  }

  function handlePreviousQuestion() {
    if (currentQuestion > 0) {
      currentQuestion--;
      showQuestion(currentQuestion);
    }
  }

  function validateCurrentQuestion() {
    const currentQ = questions[currentQuestion];
    const requiredInputs = currentQ.querySelectorAll('input[required]');
    let isValid = true;

    // Проверка обычных полей
    requiredInputs.forEach(input => {
      if ((input.type === 'checkbox' || input.type === 'radio') &&
          !currentQ.querySelector(`input[name="${input.name}"]:checked`)) {
        isValid = false;
        highlightError(input);
      } else if (!input.value.trim() && input.hasAttribute('required')) {
        isValid = false;
        highlightError(input);
      }
    });

    // Проверка, выбран ли хотя бы один вариант (если нет required)
    const checkboxes = currentQ.querySelectorAll('input[type="checkbox"]:not([value="custom"])');
    if (checkboxes.length > 0 && !currentQ.querySelector('input[type="checkbox"]:checked')) {
      isValid = false;
      checkboxes.forEach(cb => highlightError(cb));
    }

    // Проверка кастомных полей
    currentQ.querySelectorAll('input[type="checkbox"][value="custom"]').forEach(checkbox => {
      if (checkbox.checked) {
        const customInput = checkbox.parentElement.nextElementSibling.querySelector('.custom-input');
        if (!customInput.value.trim()) {
          isValid = false;
          highlightError(customInput);
        }
      }
    });

    if (!isValid) {
      alert('Пожалуйста, ответьте на вопрос');
      // Прокрутка к первому ошибочному полю
      const firstError = currentQ.querySelector('[style*="color: rgb(255, 0, 0)"], [style*="border-color: rgb(255, 0, 0)"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    return isValid;
  }

  function highlightError(input) {
    if (input.type === 'checkbox' || input.type === 'radio') {
      document.querySelectorAll(`input[name="${input.name}"]`).forEach(item => {
        item.parentElement.style.color = '#ff0000';
      });
    } else {
      input.style.borderColor = '#ff0000';
    }
  }

  // Сброс подсветки ошибок при изменении
  document.addEventListener('change', function(e) {
    if (e.target.tagName === 'INPUT') {
      if (e.target.type === 'checkbox' || e.target.type === 'radio') {
        document.querySelectorAll(`input[name="${e.target.name}"]`).forEach(item => {
          item.parentElement.style.color = '';
        });
      } else {
        e.target.style.borderColor = '';
      }
    }
  });

  // Сброс подсветки для текстовых полей при вводе
  document.addEventListener('input', function(e) {
    if (e.target.classList.contains('custom-input')) {
      e.target.style.borderColor = '';
    }
  });

  initQuiz();
});