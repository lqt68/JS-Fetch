const API_URL_PRIVAT = `https://api.privatbank.ua/p24api/exchange_rates?json&date=`;

const btnPrivat = document.getElementById('loadPrivat');
const dateInput = document.getElementById('date');
const ratesTodayContainer = document.getElementById('rates-today');
const ratesArchiveContainer = document.getElementById('rates-archive');

const convertBtn = document.getElementById('convert');
const amountInput = document.getElementById('amount');
const currencyFromSelect = document.getElementById('currency-from');
const currencyToSelect = document.getElementById('currency-to');
const converterResultDiv = document.getElementById('converter-result');

let todayRatesStore = {};

document.addEventListener('DOMContentLoaded', getTodayRates);
btnPrivat.addEventListener('click', getArchiveRates);
convertBtn.addEventListener('click', convertCurrency);

async function getTodayRates() {
    const today = new Date();
    const formattedDate = formatDate(today);
    
    try {
        const data = await fetchRates(formattedDate);
        storeRates(data.exchangeRate);
        renderRates(data, ratesTodayContainer);
    } catch (error) {
        ratesTodayContainer.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    }
}

async function getArchiveRates() {
    const selectedDate = dateInput.value;
    if (!selectedDate) {
        alert('Будь ласка, оберіть дату');
        return;
    }

    const formattedDate = selectedDate.split('-').reverse().join('.');
    ratesArchiveContainer.innerHTML = `<div class="spinner-border spinner-border-sm" role="status"></div>`;

    try {
        const data = await fetchRates(formattedDate);
        renderRates(data, ratesArchiveContainer);
        btnPrivat.setAttribute('disabled', true);
    } catch (error) {
        ratesArchiveContainer.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    }
}

async function fetchRates(dateString) {
    const response = await fetch(API_URL_PRIVAT + dateString);
    if (!response.ok) {
        throw new Error(`Помилка API. Статус: ${response.status}`);
    }
    const data = await response.json();
    if (data.error) {
        throw new Error(data.error);
    }
    return data;
}

function renderRates(data, container) {
    const neededCurrencies = ['USD', 'EUR', 'PLN'];
    const rates = data.exchangeRate.filter(rate => 
        neededCurrencies.includes(rate.currency)
    );

    if (rates.length === 0) {
          container.innerHTML = `<p class="text-muted">Даних для цієї дати немає.</p>`;
          return;
    }

    const header = (container === ratesTodayContainer) ? '' : `<h5 class="mb-3">Курс на ${data.date}</h5>`;

    const ratesHtml = rates.map(rate => {
        return `
            <div class="card bg-light mb-2">
                <div class="card-body p-2">
                    <strong class="fs-5">${rate.currency}</strong>
                    <div class="d-flex justify-content-between">
                        <span>Купівля:</span>
                        <strong>${rate.purchaseRate.toFixed(2)} UAH</strong>
                    </div>
                    <div class="d-flex justify-content-between">
                        <span>Продаж:</span>
                        <strong>${rate.saleRate.toFixed(2)} UAH</strong>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = header + ratesHtml;
}

function storeRates(ratesArray) {
    todayRatesStore['UAH'] = { purchaseRate: 1, saleRate: 1 };
    
    ratesArray.forEach(rate => {
        todayRatesStore[rate.currency] = rate;
    });
}

function convertCurrency() {
    const amount = parseFloat(amountInput.value);
    const from = currencyFromSelect.value;
    const to = currencyToSelect.value;

    if (isNaN(amount) || amount <= 0) {
        alert('Введіть коректну суму');
        return;
    }

    if (Object.keys(todayRatesStore).length === 0) {
        alert('Курси ще не завантажені, зачекайте.');
        return;
    }

    let result = 0;
    
    if (from === to) {
        result = amount;
    } else if (from === 'UAH') {
        const rate = todayRatesStore[to].saleRate;
        result = amount / rate;
    } else if (to === 'UAH') {
        const rate = todayRatesStore[from].purchaseRate;
        result = amount * rate;
    } else {
        const uahAmount = amount * todayRatesStore[from].purchaseRate;
        result = uahAmount / todayRatesStore[to].saleRate;
    }

    converterResultDiv.innerHTML = `<strong>${amount.toFixed(2)} ${from} = ${result.toFixed(2)} ${to}</strong>`;
    converterResultDiv.classList.remove('d-none');
}

function formatDate(dateObj) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}.${month}.${year}`;
}
