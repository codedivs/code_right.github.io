document.querySelectorAll('.answer-block').forEach(block => {
  block.addEventListener('touchstart', (e) => {
    e.preventDefault(); // stop long-press delay
    const touch = e.touches[0];
    const element = e.target;

    element.classList.add('dragging');
    const offsetX = touch.clientX - element.getBoundingClientRect().left;
    const offsetY = touch.clientY - element.getBoundingClientRect().top;

    const move = (moveEvent) => {
      const touchMove = moveEvent.touches[0];
      element.style.position = 'fixed';
      element.style.left = `${touchMove.clientX - offsetX}px`;
      element.style.top = `${touchMove.clientY - offsetY}px`;
      element.style.zIndex = 1000;
    };

    const end = () => {
      element.classList.remove('dragging');
      element.style.position = '';
      element.style.left = '';
      element.style.top = '';
      element.style.zIndex = '';
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
    };

    window.addEventListener('touchmove', move);
    window.addEventListener('touchend', end);
  });
});
