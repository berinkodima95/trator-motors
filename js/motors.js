/* Trator Motors — інтерактив і події Google Analytics 4 (воронка продажів) */
(function () {
  var CARS = {"camry": {"name": "Toyota Camry 2.5 Hybrid", "year": 2021, "km": "38 000 км", "fuel": "Гібрид", "gear": "Автомат", "body": "Седан", "price": 27500}, "tiguan": {"name": "Volkswagen Tiguan R-Line", "year": 2021, "km": "41 000 км", "fuel": "Бензин 2.0 TSI", "gear": "Автомат", "body": "Кросовер", "price": 31800}, "tesla3": {"name": "Tesla Model 3 Long Range", "year": 2021, "km": "29 000 км", "fuel": "Електро", "gear": "Автомат", "body": "Електро", "price": 26900}, "eclass": {"name": "Mercedes-Benz E-Class Coupe", "year": 2019, "km": "52 000 км", "fuel": "Бензин 2.0", "gear": "Автомат", "body": "Купе", "price": 39900}, "x4": {"name": "BMW X4 M Sport", "year": 2020, "km": "47 000 км", "fuel": "Дизель 2.0", "gear": "Автомат", "body": "Кросовер", "price": 44500}, "sportage": {"name": "Kia Sportage 1.6 T-GDI", "year": 2022, "km": "19 000 км", "fuel": "Бензин 1.6", "gear": "Автомат", "body": "Кросовер", "price": 29700}, "a8": {"name": "Audi A8 L 55 TFSI", "year": 2018, "km": "68 000 км", "fuel": "Бензин 3.0", "gear": "Автомат", "body": "Седан", "price": 41000}, "x7": {"name": "BMW X7 xDrive40i", "year": 2020, "km": "55 000 км", "fuel": "Бензин 3.0", "gear": "Автомат", "body": "Кросовер", "price": 72000}, "avalon": {"name": "Toyota Avalon Hybrid", "year": 2019, "km": "61 000 км", "fuel": "Гібрид", "gear": "Автомат", "body": "Седан", "price": 24600}};

  // відправка події в GA4 (якщо gtag завантажився)
  function track(name, params) {
    if (typeof gtag === 'function') gtag('event', name, params || {});
  }
  function gaItem(id, i) {
    var c = CARS[id]; if (!c) return null;
    return { item_id: id, item_name: c.name, item_brand: c.name.split(' ')[0], item_category: c.body,
             item_variant: String(c.year), price: c.price, index: i || 0, quantity: 1 };
  }
  function fmt(v) { return v.toLocaleString('uk-UA').replace(/,/g, ' ') + ' $'; }
  var qs = new URLSearchParams(location.search);

  // 1. перегляд списку авто (головна / каталог)
  document.querySelectorAll('[data-list-name]').forEach(function (list) {
    var items = [];
    list.querySelectorAll('[data-car]').forEach(function (b, i) { var it = gaItem(b.dataset.car, i); if (it) items.push(it); });
    if (items.length) track('view_item_list', { item_list_name: list.dataset.listName, items: items });
  });

  // 2. «Детальніше» — картка авто у вікні (select_item + view_item)
  var modal = document.getElementById('carModal');
  document.querySelectorAll('[data-details]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var box = btn.closest('[data-car]'), id = box.dataset.car, c = CARS[id];
      track('select_item', { item_list_name: box.dataset.list, items: [gaItem(id)] });
      track('view_item', { currency: 'USD', value: c.price, items: [gaItem(id)] });
      if (!modal || !window.jQuery) { location.href = 'contact.html?car=' + id + '#order'; return; }
      modal.querySelector('.car_modal__img').src = 'images/car-' + id + '.webp';
      modal.querySelector('.car_modal__img').alt = c.name + ' ' + c.year;
      modal.querySelector('.car_modal__title').textContent = c.name + ', ' + c.year;
      modal.querySelector('.car_modal__price').textContent = fmt(c.price);
      modal.querySelector('.car_modal__list').innerHTML =
        '<li><b>Рік:</b> ' + c.year + '</li><li><b>Пробіг:</b> ' + c.km + '</li><li><b>Пальне:</b> ' + c.fuel +
        '</li><li><b>Коробка:</b> ' + c.gear + '</li><li><b>Кузов:</b> ' + c.body + '</li>';
      modal.querySelector('[data-request]').href = 'contact.html?car=' + id + '#order';
      modal.querySelector('[data-request]').dataset.car = id;
      window.jQuery(modal).modal('show');
    });
  });

  // 3. «Залишити заявку» / «Записатися на тест-драйв» — початок оформлення
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-request]'); if (!a) return;
    var box = a.closest('[data-car]'), id = (box && box.dataset.car) || a.dataset.car;
    if (id && CARS[id]) track('begin_checkout', { currency: 'USD', value: CARS[id].price, items: [gaItem(id)] });
  });

  // пошук на головній -> каталог з фільтром
  var search = document.querySelector('[data-search]');
  if (search) search.addEventListener('submit', function () {
    var f = new FormData(search);
    track('search', { search_term: [f.get('brand'), f.get('body'), f.get('max')].filter(Boolean).join(' ') || 'усі авто' });
  });

  // фільтр каталогу (кнопки + параметри з пошуку)
  var cards = document.querySelectorAll('.car_item'), empty = document.querySelector('.empty_msg');
  function applyFilter(body, brand, max) {
    var shown = 0;
    cards.forEach(function (card) {
      var c = CARS[card.querySelector('[data-car]').dataset.car];
      var ok = (!body || body === 'Усі' || c.body === body) && (!brand || c.name.indexOf(brand) === 0) &&
               (!max || (max === '100000' ? c.price > 45000 : c.price <= +max));
      card.hidden = !ok; if (ok) shown++;
    });
    if (empty) empty.hidden = shown > 0;
  }
  document.querySelectorAll('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('[data-filter]').forEach(function (x) { x.classList.toggle('is-active', x === b); });
      applyFilter(b.dataset.filter);
    });
  });
  if (document.querySelector('[data-filter]') && (qs.get('body') || qs.get('brand') || qs.get('max'))) {
    applyFilter(qs.get('body'), qs.get('brand'), qs.get('max'));
  }

  // форма заявки: авто з посилання, перегляд форми, заявка (generate_lead)
  document.querySelectorAll('[data-lead-form]').forEach(function (form) {
    var sel = form.querySelector('[name="car"]'), msg = form.querySelector('.form_msg');
    if (qs.get('car') && CARS[qs.get('car')]) {
      sel.value = qs.get('car');
      track('view_cart', { currency: 'USD', value: CARS[sel.value].price, items: [gaItem(sel.value)] });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.name.value.trim(), phone = form.phone.value.replace(/\D/g, '');
      if (name.length < 2 || phone.length < 10) {
        msg.hidden = false; msg.className = 'form_msg is-error';
        msg.textContent = 'Вкажіть, будь ласка, ім’я та номер телефону (не менше 10 цифр).';
        return;
      }
      var id = sel.value, params = { lead_source: 'site_form', lead_goal: form.goal.value, currency: 'USD', value: id ? CARS[id].price : 0 };
      if (id) params.items = [gaItem(id)];
      track('generate_lead', params);
      msg.hidden = false; msg.className = 'form_msg is-ok';
      msg.textContent = 'Дякуємо, ' + name + '! Заявку прийнято. Це навчальний сайт, тому дзвінка не буде 🙂';
      form.reset();
    });
  });

  // підписка у футері
  document.querySelectorAll('[data-subscribe]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault(); track('sign_up', { method: 'newsletter' });
      f.innerHTML = '<p class="footer_text">Дякуємо за підписку!</p>';
    });
  });

  // тінь шапки при прокручуванні
  var hdr = document.querySelector('.header_section');
  window.addEventListener('scroll', function () { hdr && hdr.classList.toggle('is-scrolled', window.scrollY > 10); });
})();
