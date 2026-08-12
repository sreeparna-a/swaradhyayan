document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
    button.parentElement.querySelectorAll('[data-filter]').forEach((item) => item.classList.remove('active'));
    button.classList.add('active'); const value = button.dataset.filter;
    document.querySelectorAll('[data-category]').forEach((card) => { card.hidden = value !== 'all' && !card.dataset.category.split(' ').includes(value); });
  }));
  document.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => {
    button.parentElement.querySelectorAll('[data-tab]').forEach((item) => item.classList.remove('active'));
    button.classList.add('active'); const value = button.dataset.tab;
    document.querySelectorAll('[data-status]').forEach((item) => { item.hidden = value !== 'all' && item.dataset.status !== value; });
  }));
  document.querySelectorAll('.page-search input').forEach((input) => input.addEventListener('input', () => {
    const term = input.value.toLowerCase(); document.querySelectorAll('[data-searchable]').forEach((item) => { item.hidden = !item.textContent.toLowerCase().includes(term); });
  }));
});
