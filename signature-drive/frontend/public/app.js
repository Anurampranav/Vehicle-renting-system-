// ===================== CONFIG =====================
const API = 'http://localhost:5000/api';

// ===================== HTTP HELPER ================
async function http(method, path, body, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = localStorage.getItem('sdr_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const api = {
  get:    (path, auth)       => http('GET',    path, null, auth),
  post:   (path, body, auth) => http('POST',   path, body, auth),
  put:    (path, body)       => http('PUT',    path, body),
  patch:  (path, body)       => http('PATCH',  path, body),
  delete: (path)             => http('DELETE', path),
};

// ===================== STATE =====================
let currentUser   = JSON.parse(localStorage.getItem('sdr_user') || 'null');
let selectedVehicle = null;
let currentRating   = 0;
let reviewBookingId = null;
let currentCategory = 'All';
let currentMaxPrice = 5000;
let signinRole      = 'customer';
let activeTicketId  = null;
let locationPickerTarget = 'search';
let pickerStep           = 'state';
let pickerSelectedState  = '';

// ===================== INDIA LOCATION DATA =====================
const INDIA_LOCATIONS = {
  "Andhra Pradesh":["Visakhapatnam","Vijayawada","Guntur","Nellore","Kurnool","Tirupati","Rajahmundry","Kakinada","Anantapur","Eluru"],
  "Arunachal Pradesh":["Itanagar","Naharlagun","Pasighat","Tawang","Ziro"],
  "Assam":["Guwahati","Silchar","Dibrugarh","Jorhat","Nagaon","Tinsukia","Tezpur","Bongaigaon"],
  "Bihar":["Patna","Gaya","Muzaffarpur","Bhagalpur","Darbhanga","Arrah","Begusarai","Katihar","Munger","Purnia"],
  "Chhattisgarh":["Raipur","Bhilai","Bilaspur","Korba","Durg","Rajnandgaon","Jagdalpur","Ambikapur"],
  "Goa":["Panaji","Margao","Vasco da Gama","Mapusa","Ponda","Canacona","Calangute","Anjuna"],
  "Gujarat":["Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar","Jamnagar","Gandhinagar","Junagadh","Anand","Navsari","Morbi","Nadiad"],
  "Haryana":["Faridabad","Gurugram","Panipat","Ambala","Yamunanagar","Rohtak","Hisar","Karnal","Sonipat","Panchkula"],
  "Himachal Pradesh":["Shimla","Manali","Dharamshala","Solan","Mandi","Kullu","Baddi","Palampur","Nahan","Bilaspur"],
  "Jharkhand":["Ranchi","Jamshedpur","Dhanbad","Bokaro","Deoghar","Phusro","Hazaribagh","Giridih"],
  "Karnataka":["Bengaluru","Mysuru","Hubli","Mangaluru","Belagavi","Davanagere","Ballari","Vijayapura","Shivamogga","Tumakuru","Udupi","Hassan","Dharwad"],
  "Kerala":["Thiruvananthapuram","Kochi","Kozhikode","Thrissur","Kollam","Kannur","Palakkad","Alappuzha","Kottayam","Malappuram","Kasaragod","Wayanad"],
  "Madhya Pradesh":["Indore","Bhopal","Jabalpur","Gwalior","Ujjain","Sagar","Dewas","Satna","Ratlam","Rewa","Murwara","Singrauli"],
  "Maharashtra":["Mumbai","Pune","Nagpur","Nashik","Aurangabad","Solapur","Amravati","Kolhapur","Navi Mumbai","Thane","Pimpri-Chinchwad","Ulhasnagar","Sangli","Jalgaon","Akola"],
  "Manipur":["Imphal","Thoubal","Bishnupur","Churachandpur","Senapati"],
  "Meghalaya":["Shillong","Tura","Nongstoin","Jowai","Baghmara"],
  "Mizoram":["Aizawl","Lunglei","Champhai","Serchhip","Kolasib"],
  "Nagaland":["Kohima","Dimapur","Mokokchung","Tuensang","Wokha"],
  "Odisha":["Bhubaneswar","Cuttack","Rourkela","Brahmapur","Sambalpur","Puri","Balasore","Baripada","Bhadrak","Jharsuguda"],
  "Punjab":["Ludhiana","Amritsar","Jalandhar","Patiala","Bathinda","Hoshiarpur","Batala","Pathankot","Moga","Abohar","Phagwara","Firozpur"],
  "Rajasthan":["Jaipur","Jodhpur","Kota","Bikaner","Ajmer","Udaipur","Bhilwara","Alwar","Bharatpur","Sikar","Pali","Sri Ganganagar"],
  "Sikkim":["Gangtok","Namchi","Gyalshing","Mangan","Rangpo"],
  "Tamil Nadu":["Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Tirunelveli","Tiruppur","Vellore","Erode","Thoothukudi","Dindigul","Thanjavur","Ranipet","Sivakasi"],
  "Telangana":["Hyderabad","Warangal","Nizamabad","Khammam","Karimnagar","Ramagundam","Mahbubnagar","Nalgonda","Adilabad","Suryapet"],
  "Tripura":["Agartala","Dharmanagar","Udaipur","Kailasahar","Belonia"],
  "Uttar Pradesh":["Lucknow","Kanpur","Ghaziabad","Agra","Varanasi","Meerut","Prayagraj","Bareilly","Aligarh","Moradabad","Saharanpur","Noida","Firozabad","Jhansi","Mathura"],
  "Uttarakhand":["Dehradun","Haridwar","Roorkee","Haldwani","Kashipur","Rudrapur","Rishikesh","Mussoorie","Nainital","Almora"],
  "West Bengal":["Kolkata","Asansol","Siliguri","Durgapur","Bardhaman","Malda","Baharampur","Habra","Kharagpur","Shantipur","Dankuni","Dhulian"],
  "Delhi":["New Delhi","Dwarka","Rohini","Laxmi Nagar","Saket","Connaught Place","Janakpuri","Pitampura","Shahdara","Vasant Kunj"],
  "Chandigarh":["Chandigarh","Mohali","Panchkula"],
  "Puducherry":["Puducherry","Karaikal","Mahe","Yanam"],
  "Jammu & Kashmir":["Srinagar","Jammu","Anantnag","Sopore","Baramulla","Leh","Kargil","Udhampur","Kathua"],
  "Ladakh":["Leh","Kargil","Nubra","Zanskar"],
  "Andaman & Nicobar":["Port Blair","Diglipur","Rangat","Car Nicobar"],
  "Dadra & Nagar Haveli":["Silvassa","Amli","Khanvel"],
  "Lakshadweep":["Kavaratti","Agatti","Minicoy"],
};

// ===================== TOAST =====================
function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

// ===================== MODALS =====================
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(m =>
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); })
);

// ===================== AUTH =====================
function setSigninRole(role) {
  signinRole = role;
  const active   = 'flex-1 py-2 rounded-md text-label-md transition-all bg-primary text-on-primary';
  const inactive = 'flex-1 py-2 rounded-md text-label-md transition-all text-on-surface-variant';
  document.getElementById('roleCustomerBtn').className = role === 'customer' ? active : inactive;
  document.getElementById('roleAdminBtn').className    = role === 'admin'    ? active : inactive;
}

function switchToRegister() {
  document.getElementById('signinView').classList.add('hidden');
  document.getElementById('registerView').classList.remove('hidden');
}
function switchToSignin() {
  document.getElementById('registerView').classList.add('hidden');
  document.getElementById('signinView').classList.remove('hidden');
}

async function handleSignin() {
  const email    = document.getElementById('signinEmail').value.trim();
  const password = document.getElementById('signinPassword').value;
  if (!email || !password) { showToast('Please fill all fields'); return; }
  try {
    const { token, user } = await api.post('/auth/login', { email, password, role: signinRole }, false);
    localStorage.setItem('sdr_token', token);
    localStorage.setItem('sdr_user',  JSON.stringify(user));
    currentUser = user;
    closeModal('signinModal');
    updateAuthUI();
    if (user.role === 'admin') showAdminView();
    else { showCustomerPage('home'); showToast(`Welcome back, ${user.name}!`); }
  } catch (err) { showToast(err.message); }
}

async function handleRegister() {
  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const phone    = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPassword').value;
  if (!name || !email || !phone || !password) { showToast('Please fill all fields'); return; }
  try {
    const { token, user } = await api.post('/auth/register', { name, email, phone, password }, false);
    localStorage.setItem('sdr_token', token);
    localStorage.setItem('sdr_user',  JSON.stringify(user));
    currentUser = user;
    closeModal('signinModal');
    updateAuthUI();
    showToast(`Welcome, ${name}! Account created.`);
  } catch (err) { showToast(err.message); }
}

function signOut() {
  currentUser = null;
  localStorage.removeItem('sdr_token');
  localStorage.removeItem('sdr_user');
  showCustomerView();
  updateAuthUI();
  showToast('Signed out successfully');
}

function updateAuthUI() {
  const area = document.getElementById('authBtnArea');
  if (currentUser) {
    area.innerHTML = `<div class="flex items-center gap-3 ml-4">
      <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm">${currentUser.name[0]}</div>
      <span class="text-label-md text-on-surface">${currentUser.name.split(' ')[0]}</span>
      <button onclick="signOut()" class="px-4 py-2 border border-outline-variant rounded-lg text-label-md text-on-surface-variant hover:bg-surface-container transition-colors">Sign out</button>
      ${currentUser.role === 'admin' ? `<button onclick="showAdminView()" class="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md">Admin</button>` : ''}
    </div>`;
    if (currentUser.role === 'admin') {
      document.getElementById('adminName').textContent  = currentUser.name;
      document.getElementById('adminEmail2').textContent = currentUser.email;
      document.getElementById('adminAvatar').textContent = currentUser.name[0];
    }
  } else {
    area.innerHTML = `<button onclick="openModal('signinModal')" class="ml-4 px-6 py-2 bg-primary text-on-primary rounded-lg text-label-md transition-transform active:scale-95 hover:shadow-lg">Sign In</button>`;
  }
}

function requireAuth(cb) {
  if (!currentUser) { openModal('signinModal'); return; }
  cb();
}

function toggleMobileMenu() {
  const m = document.getElementById('mobileNav');
  m.classList.toggle('hidden');
  m.classList.toggle('flex');
}

// ===================== VIEW SWITCHING =====================
function showCustomerView() {
  document.getElementById('customerApp').classList.add('active');
  document.getElementById('adminApp').classList.remove('active');
  document.getElementById('customerFooter').style.display = '';
}
function showAdminView() {
  document.getElementById('adminApp').classList.add('active');
  document.getElementById('customerApp').classList.remove('active');
  document.getElementById('customerFooter').style.display = 'none';
  refreshAdminData();
  showAdminPage('dashboard');
}
function switchToCustomer() {
  showCustomerView();
  showCustomerPage('home');
}

function showCustomerPage(page) {
  document.querySelectorAll('[id^="custPage-"]').forEach(el => el.classList.add('hidden'));
  const el = document.getElementById('custPage-' + page);
  if (el) el.classList.remove('hidden');
  if (page === 'myBookings') renderMyBookings();
  if (page === 'offers')     renderOffers();
  if (page === 'support')    { prefillSupportUser(); renderMyTickets(); }
}

function showAdminPage(page) {
  document.querySelectorAll('[id^="adminPage-"]').forEach(el => el.classList.add('hidden'));
  const el = document.getElementById('adminPage-' + page);
  if (el) el.classList.remove('hidden');
  document.querySelectorAll('.admin-link').forEach(l => l.classList.remove('active'));
  const navEl = document.getElementById('adminNav-' + page);
  if (navEl) navEl.classList.add('active');
  const titles = { dashboard:'Dashboard', vehicles:'My Vehicles', bookings:'Bookings', customers:'Customers', earnings:'Earnings', reviews:'Reviews', support:'Support Tickets' };
  document.getElementById('adminPageTitle').textContent    = titles[page] || page;
  document.getElementById('adminPageSubtitle').textContent = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' });
  if (page === 'vehicles')  renderAdminVehicles();
  if (page === 'bookings')  renderAdminBookings();
  if (page === 'customers') renderAdminCustomers();
  if (page === 'earnings')  renderEarnings();
  if (page === 'reviews')   renderAdminReviews();
  if (page === 'support')   renderAdminTickets();
  if (page === 'dashboard') refreshAdminData();
}

// ===================== HELPERS =====================
function getIcon(cat) {
  return { Scooter:'moped', Hatchback:'directions_car', Sedan:'directions_car', SUV:'airport_shuttle' }[cat] || 'directions_car';
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

function fmt(n) { return Number(n).toLocaleString('en-IN'); }

function vehicleCard(v) {
  const rating = v.rating ? `<span class="text-label-sm text-amber-500 flex items-center gap-1"><span class="material-symbols-outlined text-base" style="font-variation-settings:'FILL' 1">star</span>${v.rating.avg} (${v.rating.count})</span>` : '';
  return `<div class="glass-card card-hover w-72 p-6 rounded-xl flex flex-col transition-transform duration-300">
    <div class="w-full h-32 mb-4 flex items-center justify-center">
      ${v.imageUrl ? `<img src="${v.imageUrl}" class="w-full h-full object-cover rounded-lg" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>` : ''}
      <div class="w-40 h-24 bg-primary/10 rounded-lg flex items-center justify-center ${v.imageUrl ? 'hidden' : ''}">
        <span class="material-symbols-outlined text-primary text-5xl">${v.icon || getIcon(v.category)}</span>
      </div>
    </div>
    <div class="flex items-center justify-between mb-1">
      <span class="badge badge-gray">${v.category}</span>
      ${rating}
    </div>
    <h3 class="text-xl font-semibold text-on-surface mb-1 mt-2">${v.name}</h3>
    <p class="text-body-md text-primary font-bold mb-3">₹${fmt(v.pricePerDay)}/day</p>
    <div class="grid grid-cols-2 gap-y-2 mb-5 text-on-surface-variant">
      <div class="flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">group</span><span class="text-label-sm">${v.seats} Seats</span></div>
      <div class="flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">local_gas_station</span><span class="text-label-sm">${v.fuel}</span></div>
      <div class="flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">settings</span><span class="text-label-sm">${v.transmission}</span></div>
      <div class="flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">location_on</span><span class="text-label-sm">${v.location}</span></div>
    </div>
    <button onclick="openBooking('${v._id}')" class="w-full py-3 bg-secondary text-on-secondary rounded-lg text-label-md hover:bg-primary transition-colors mt-auto">Book now</button>
  </div>`;
}

// ===================== VEHICLE GRID =====================
async function renderVehicleGrid() {
  const grid  = document.getElementById('vehicleGrid');
  const noMsg = document.getElementById('noVehiclesMsg');
  grid.innerHTML = `<div class="text-on-surface-variant py-8">Loading vehicles...</div>`;

  const params = new URLSearchParams({ available: 'true' });
  if (currentCategory !== 'All') params.append('category', currentCategory);
  if (currentMaxPrice < 5000)    params.append('maxPrice', currentMaxPrice);
  const loc = document.getElementById('searchLocation').value.trim();
  if (loc) params.append('location', loc);

  try {
    const { data } = await api.get(`/vehicles?${params}`, false);
    if (!data.length) { grid.innerHTML = ''; noMsg.classList.remove('hidden'); return; }
    noMsg.classList.add('hidden');
    grid.innerHTML = data.map(vehicleCard).join('');
  } catch (err) {
    grid.innerHTML = `<p class="text-error py-8">Failed to load vehicles: ${err.message}</p>`;
  }
}

function filterCategory(el, cat) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  currentCategory = cat;
  renderVehicleGrid();
}

function filterByPrice() {
  currentMaxPrice = parseInt(document.getElementById('priceFilter').value);
  renderVehicleGrid();
}

function searchVehicles() { renderVehicleGrid(); }

// ===================== BOOKING =====================
async function openBooking(vid) {
  if (!currentUser) { openModal('signinModal'); return; }
  try {
    const { data: v } = await api.get(`/vehicles/${vid}`, false);
    selectedVehicle = v;

    document.getElementById('summaryPrice').textContent = `₹${fmt(v.pricePerDay)}/day`;
    document.getElementById('floatingSummary').classList.remove('hidden');

    document.getElementById('bookingVehicleInfo').innerHTML = `
      <div class="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
        <span class="material-symbols-outlined text-primary text-3xl">${v.icon || getIcon(v.category)}</span>
      </div>
      <div>
        <h3 class="text-headline-sm font-semibold text-on-surface">${v.name}</h3>
        <p class="text-label-sm text-on-surface-variant">${v.category} · ${v.fuel} · ${v.seats} seats</p>
        <p class="text-primary font-bold">₹${fmt(v.pricePerDay)}/day</p>
      </div>`;

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bookPickupDate').min   = today;
    document.getElementById('bookReturnDate').min   = today;
    document.getElementById('bookPickupDate').value = '';
    document.getElementById('bookReturnDate').value = '';
    document.getElementById('bookLocation').value   = '';
    document.getElementById('bookLocationDisplay').textContent = 'Select State → City';
    document.getElementById('bookingPriceSummary').innerHTML = '<p class="text-label-sm text-on-surface-variant">Select dates to see pricing</p>';

    ['bookPickupDate', 'bookReturnDate'].forEach(id =>
      document.getElementById(id).addEventListener('change', updateBookingSummary)
    );
    openModal('bookingModal');
  } catch (err) { showToast('Could not load vehicle: ' + err.message); }
}

function proceedFromSummary() {
  if (!selectedVehicle) return;
  openBooking(selectedVehicle._id);
}

function updateBookingSummary() {
  if (!selectedVehicle) return;
  const p = document.getElementById('bookPickupDate').value;
  const r = document.getElementById('bookReturnDate').value;
  if (!p || !r) return;
  const days     = Math.max(1, Math.ceil((new Date(r) - new Date(p)) / (1000 * 60 * 60 * 24)));
  const subtotal = selectedVehicle.pricePerDay * days;
  const tax      = Math.round(subtotal * 0.18);
  const total    = subtotal + tax;
  document.getElementById('bookingPriceSummary').innerHTML = `
    <div class="flex flex-col gap-1">
      <div class="flex justify-between text-label-sm"><span>₹${fmt(selectedVehicle.pricePerDay)}/day × ${days} days</span><span>₹${fmt(subtotal)}</span></div>
      <div class="flex justify-between text-label-sm text-on-surface-variant"><span>GST (18%)</span><span>₹${fmt(tax)}</span></div>
      <div class="flex justify-between text-label-md font-bold text-primary border-t border-outline-variant pt-2 mt-1"><span>Total</span><span>₹${fmt(total)}</span></div>
    </div>`;
}

async function confirmBooking() {
  const pickupDate    = document.getElementById('bookPickupDate').value;
  const returnDate    = document.getElementById('bookReturnDate').value;
  const location      = document.getElementById('bookLocation').value.trim();
  const paymentMethodRaw = document.querySelector('input[name="payment"]:checked')?.value || 'Card';
  const paymentMethod = paymentMethodRaw.charAt(0).toUpperCase() + paymentMethodRaw.slice(1).toLowerCase();
  if (!pickupDate || !returnDate || !location) { showToast('Please fill all fields'); return; }
  if (new Date(returnDate) <= new Date(pickupDate)) { showToast('Return date must be after pickup date'); return; }

  try {
    const { data } = await api.post('/bookings', {
      vehicleId: selectedVehicle._id, pickupDate, returnDate, location, paymentMethod,
    });
    
    closeModal('bookingModal');
    document.getElementById('floatingSummary').classList.add('hidden');
    selectedVehicle = null;
    
    // For non-cash payments, proceed with Razorpay
    if (paymentMethod !== 'Cash') {
      openRazorpayCheckout(data);
    } else {
      showToast(`✅ Booking confirmed! Total: ₹${fmt(data.total)}`);
    }
  } catch (err) { showToast(err.message); }
}

// ── RAZORPAY INTEGRATION ───────────────────────────────────────────────
function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(window.Razorpay); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
}

async function openRazorpayCheckout(booking) {
  try {
    const Razorpay = await loadRazorpayScript();
    
    const { data: orderData } = await api.post('/payments/create-order', {
      bookingId: booking._id,
    });

    const options = {
      key: 'rzp_test_T6juyNpNTGRDeY',
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Signature Drive Rentals',
      description: `Booking for ${booking.vehicle?.name || 'Vehicle'}`,
      order_id: orderData.orderId,
      handler: async function (response) {
        try {
          const verifyData = await api.post('/payments/verify', {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            paymentId: orderData.paymentId,
          });
          showToast('✅ Payment successful! Booking confirmed.');
          showCustomerPage('myBookings');
          renderMyBookings();
        } catch (err) {
          showToast('Payment verification failed: ' + err.message);
        }
      },
      modal: {
        ondismiss: function() {
          showToast('Payment cancelled');
        }
      },
      theme: { color: '#44613b' },
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    showToast('Payment error: ' + err.message);
  }
}

// ===================== MY BOOKINGS =====================
async function renderMyBookings() {
  if (!currentUser) return;
  const list  = document.getElementById('myBookingsList');
  const noMsg = document.getElementById('noBookingsMsg');
  list.innerHTML = '<p class="text-on-surface-variant">Loading...</p>';

  try {
    const { data: bookings } = await api.get('/bookings/my');
    if (!bookings.length) { list.innerHTML = ''; noMsg.classList.remove('hidden'); return; }
    noMsg.classList.add('hidden');

    const reviewsRes = await api.get('/reviews/vehicle/all').catch(() => ({ data: [] }));

    const statusColors = { Confirmed:'badge-blue', Active:'badge-green', Completed:'badge-gray', Cancelled:'badge-red', Paid:'badge-green' };
    const paymentIcons = { UPI:'account_balance', Card:'credit_card', Cash:'money_bag' };
    list.innerHTML = bookings.map(b => {
      const canReview = b.status === 'Completed';
      const canPay = b.status === 'Confirmed' && b.paymentMethod !== 'Cash';
      return `<div class="glass-card p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined text-primary text-2xl">${getIcon(b.vehicle?.category)}</span>
          </div>
          <div>
            <h3 class="text-headline-sm font-semibold text-on-surface">${b.vehicle?.name || '—'}</h3>
            <p class="text-label-sm text-on-surface-variant">${formatDate(b.pickupDate)} → ${formatDate(b.returnDate)} · ${b.days} day${b.days > 1 ? 's' : ''}</p>
            <p class="text-label-sm text-on-surface-variant">📍 ${b.location} · <span class="material-symbols-outlined text-[16px] align-middle">${paymentIcons[b.paymentMethod] || 'payment'}</span> ${b.paymentMethod}</p>
          </div>
        </div>
        <div class="flex flex-col items-end gap-2">
          <span class="badge ${statusColors[b.status] || 'badge-gray'}">${b.status}</span>
          <p class="text-label-md font-bold text-primary">₹${fmt(b.total)}</p>
          <div class="flex gap-2">
            ${canPay ? `<button onclick="payForBooking('${b._id}')" class="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-label-sm hover:opacity-90">Pay Now</button>` : ''}
            ${canReview ? `<button onclick="openReview('${b._id}','${b.vehicle?._id}','${b.vehicle?.name}')" class="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-label-sm hover:bg-amber-200">⭐ Review</button>` : ''}
            ${b.status === 'Confirmed' ? `<button onclick="cancelBooking('${b._id}')" class="px-3 py-1.5 border border-error/40 text-error rounded-lg text-label-sm hover:bg-error-container">Cancel</button>` : ''}
          </div>
        </div>
      </div>`;
    }).join('');
  } catch (err) {
    list.innerHTML = `<p class="text-error">${err.message}</p>`;
  }
}

async function cancelBooking(bid) {
  try {
    await api.patch(`/bookings/${bid}/cancel`, { reason: 'Cancelled by customer' });
    showToast('Booking cancelled');
    renderMyBookings();
  } catch (err) { showToast(err.message); }
}

async function payForBooking(bid) {
  try {
    const { data: booking } = await api.get(`/bookings/${bid}`);
    openRazorpayCheckout(booking);
  } catch (err) {
    showToast('Could not load booking: ' + err.message);
  }
}

// ===================== REVIEWS =====================
function openReview(bid, vid, vname) {
  reviewBookingId = bid;
  document.getElementById('reviewVehicleName').textContent     = vname;
  document.getElementById('reviewText').value                  = '';
  document.getElementById('reviewModal').dataset.vid           = vid;
  currentRating = 0;
  document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
  openModal('reviewModal');
}

function setRating(val) {
  currentRating = val;
  document.querySelectorAll('.star').forEach(s =>
    s.classList.toggle('active', parseInt(s.dataset.val) <= val)
  );
}

async function submitReview() {
  if (!currentRating) { showToast('Please select a rating'); return; }
  const text = document.getElementById('reviewText').value.trim();
  const vid  = document.getElementById('reviewModal').dataset.vid;
  try {
    await api.post('/reviews', { bookingId: reviewBookingId, vehicleId: vid, rating: currentRating, text });
    closeModal('reviewModal');
    renderMyBookings();
    showToast('Review submitted! Thank you.');
  } catch (err) { showToast(err.message); }
}

// ===================== OFFERS =====================
async function renderOffers() {
  try {
    const { data: offers } = await api.get('/offers', false);
    const colorMap = ['bg-primary-fixed', 'bg-secondary-container', 'bg-tertiary-fixed'];
    document.getElementById('offersList').innerHTML = offers.map((o, i) => `
      <div class="glass-card p-6 rounded-xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 ${colorMap[i % 3]} rounded-full mb-4">
          <span class="material-symbols-outlined text-primary text-base">local_offer</span>
          <span class="text-label-sm text-primary font-bold">${o.discountPercent ? o.discountPercent + '% OFF' : o.discountAmount ? '₹' + o.discountAmount + ' OFF' : 'OFFER'}</span>
        </div>
        <h3 class="text-headline-sm font-semibold text-on-surface mb-2">${o.title}</h3>
        <p class="text-body-md text-on-surface-variant mb-4">${o.description}</p>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 bg-surface-container px-4 py-2 rounded-lg border border-outline-variant border-dashed">
            <span class="text-label-md font-bold text-primary tracking-widest">${o.code}</span>
            <button onclick="copyCode('${o.code}')" class="material-symbols-outlined text-on-surface-variant text-base hover:text-primary">content_copy</button>
          </div>
          <p class="text-label-sm text-on-surface-variant">Valid till ${formatDate(o.validTill)}</p>
        </div>
      </div>`).join('');
  } catch (err) { console.error('Offers error:', err); }
}

function copyCode(code) {
  navigator.clipboard.writeText(code)
    .then(() => showToast(`Code "${code}" copied!`))
    .catch(() => showToast(`Code: ${code}`));
}

// ===================== SUPPORT TICKETS (Customer) =====================
function prefillSupport(category) {
  document.getElementById('suppCategory').value = category;
  document.getElementById('suppSubject').focus();
}

function prefillSupportUser() {
  if (currentUser) {
    document.getElementById('suppName').value  = currentUser.name  || '';
    document.getElementById('suppEmail').value = currentUser.email || '';
  }
}

async function submitSupportTicket() {
  const customerName  = document.getElementById('suppName').value.trim();
  const customerEmail = document.getElementById('suppEmail').value.trim();
  const category      = document.getElementById('suppCategory').value;
  const bookingRef    = document.getElementById('suppBookingId').value.trim();
  const subject       = document.getElementById('suppSubject').value.trim();
  const message       = document.getElementById('suppMessage').value.trim();
  const priority      = document.querySelector('input[name="suppPriority"]:checked')?.value || 'Low';

  if (!customerName || !customerEmail || !category || !subject || !message) {
    showToast('Please fill all required fields'); return;
  }

  try {
    const { data } = await api.post('/tickets', { customerName, customerEmail, category, bookingRef, subject, message, priority }, !!currentUser);
    ['suppName','suppEmail','suppBookingId','suppSubject','suppMessage'].forEach(id => {
      if (id !== 'suppName' && id !== 'suppEmail') document.getElementById(id).value = '';
    });
    document.getElementById('suppCategory').value = '';
    showToast(`✅ Ticket #${data._id.slice(-6).toUpperCase()} submitted! We'll reply within 24 hours.`);
    renderMyTickets();
  } catch (err) { showToast(err.message); }
}

async function renderMyTickets() {
  const list  = document.getElementById('myTicketsList');
  const noMsg = document.getElementById('noTicketsMsg');

  if (!currentUser) { list.innerHTML = ''; noMsg.classList.remove('hidden'); return; }

  try {
    const { data: tickets } = await api.get('/tickets/my');
    if (!tickets.length) { list.innerHTML = ''; noMsg.classList.remove('hidden'); return; }
    noMsg.classList.add('hidden');

    const priorityColors = { High:'badge-red', Medium:'badge-yellow', Low:'badge-green' };
    const statusColors   = { Open:'badge-blue', 'In Progress':'badge-yellow', Resolved:'badge-green', Closed:'badge-gray' };

    list.innerHTML = tickets.map(t => `
      <div class="glass-card p-5 rounded-xl">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="font-mono text-label-sm text-on-surface-variant">#${t._id.slice(-6).toUpperCase()}</span>
              <span class="badge ${priorityColors[t.priority] || 'badge-gray'}">${t.priority}</span>
              <span class="badge ${statusColors[t.status] || 'badge-gray'}">${t.status}</span>
            </div>
            <h4 class="text-label-md font-semibold text-on-surface">${t.subject}</h4>
            <p class="text-label-sm text-on-surface-variant">${t.category} · ${formatDate(t.createdAt)}</p>
          </div>
        </div>
        <p class="text-body-md text-on-surface-variant mb-3">${t.message}</p>
        ${t.replies.length ? `
          <div class="border-t border-outline-variant/40 pt-3 mt-2">
            <p class="text-label-sm text-on-surface-variant mb-2">Latest reply:</p>
            <div class="bg-primary-fixed/60 rounded-lg px-4 py-3">
              <p class="text-label-sm font-semibold text-primary mb-1">Support Team · ${formatDate(t.replies.at(-1).at)}</p>
              <p class="text-body-md text-on-surface">${t.replies.at(-1).text}</p>
            </div>
          </div>` : ''}
      </div>`).join('');
  } catch (err) {
    list.innerHTML = `<p class="text-error">${err.message}</p>`;
  }
}

// ===================== ADMIN — DASHBOARD =====================
async function refreshAdminData() {
  try {
    const { data } = await api.get('/admin/stats');
    document.getElementById('statVehicles').textContent  = data.totalVehicles;
    document.getElementById('statBookings').textContent  = data.activeBookings;
    document.getElementById('statCustomers').textContent = data.totalCustomers;
    document.getElementById('statRevenue').textContent   = '₹' + fmt(data.monthRevenue);

    const statusColors = { Confirmed:'badge-blue', Paid:'badge-green', Active:'badge-green', Completed:'badge-gray', Cancelled:'badge-red' };
    document.getElementById('dashRecentBookingsBody').innerHTML =
      (data.recentBookings || []).map(b => `
        <tr>
          <td>${b.customer?.name || '—'}</td>
          <td>${b.vehicle?.name  || '—'}</td>
          <td class="text-label-sm">${formatDate(b.pickupDate)} → ${formatDate(b.returnDate)}</td>
          <td class="font-semibold text-primary">₹${fmt(b.total)}</td>
          <td><span class="badge ${statusColors[b.status] || 'badge-gray'}">${b.status}</span></td>
        </tr>`).join('') || '<tr><td colspan="5" class="text-center text-on-surface-variant py-4">No bookings yet</td></tr>';

    // Open ticket badge
    const suppNav = document.getElementById('adminNav-support');
    if (suppNav && data.openTickets > 0) {
      suppNav.innerHTML = `<span class="material-symbols-outlined text-xl">support_agent</span> Support Tickets <span class="ml-auto bg-error text-on-error text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">${data.openTickets}</span>`;
    }
  } catch (err) { console.error('Dashboard error:', err); }
}

// ===================== ADMIN — VEHICLES =====================
async function renderAdminVehicles() {
  try {
    const { data: vehicles } = await api.get('/vehicles');
    document.getElementById('vehicleCount').textContent = `${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''} listed`;
    document.getElementById('adminVehiclesBody').innerHTML = vehicles.map(v => `
      <tr>
        <td><div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-primary text-sm">${v.icon || getIcon(v.category)}</span>
          </div>
          <span class="font-medium">${v.name}</span>
        </div></td>
        <td><span class="badge badge-gray">${v.category}</span></td>
        <td class="font-semibold text-primary">₹${fmt(v.pricePerDay)}</td>
        <td>${v.location}</td>
        <td><span class="badge ${v.available ? 'badge-green' : 'badge-red'}">${v.available ? 'Available' : 'Unavailable'}</span></td>
        <td><div class="flex gap-2">
          <button onclick="toggleAvailability('${v._id}')" class="px-3 py-1.5 border border-outline-variant rounded-lg text-label-sm hover:bg-surface-container">${v.available ? 'Disable' : 'Enable'}</button>
          <button onclick="openEditVehicle('${v._id}')" class="px-3 py-1.5 bg-primary-container text-on-primary-container rounded-lg text-label-sm hover:bg-primary hover:text-on-primary">Edit</button>
          <button onclick="deleteVehicle('${v._id}')" class="px-3 py-1.5 border border-error/30 text-error rounded-lg text-label-sm hover:bg-error-container">Delete</button>
        </div></td>
      </tr>`).join('') || '<tr><td colspan="6" class="text-center text-on-surface-variant py-4">No vehicles yet.</td></tr>';
  } catch (err) { console.error(err); }
}

function openAddVehicle() {
  document.getElementById('vehicleFormTitle').textContent = 'Add New Vehicle';
  document.getElementById('editVehicleId').value = '';
  ['vName','vPrice','vSeats','vLocation','vReg','vDesc','vImage'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('vCategory').value = 'Scooter';
  document.getElementById('vFuel').value     = 'Petrol';
  document.getElementById('vTransmission').value = 'Manual';
  openModal('vehicleFormModal');
}

async function openEditVehicle(vid) {
  try {
    const { data: v } = await api.get(`/vehicles/${vid}`, false);
    document.getElementById('vehicleFormTitle').textContent = 'Edit Vehicle';
    document.getElementById('editVehicleId').value     = v._id;
    document.getElementById('vName').value             = v.name;
    document.getElementById('vCategory').value         = v.category;
    document.getElementById('vPrice').value            = v.pricePerDay;
    document.getElementById('vSeats').value            = v.seats;
    document.getElementById('vFuel').value             = v.fuel;
    document.getElementById('vTransmission').value     = v.transmission;
    document.getElementById('vLocation').value         = v.location;
    document.getElementById('vReg').value              = v.registrationNumber || '';
    document.getElementById('vDesc').value             = v.description || '';
    document.getElementById('vImage').value            = v.imageUrl || '';
    openModal('vehicleFormModal');
  } catch (err) { showToast('Could not load vehicle'); }
}

async function saveVehicle() {
  const name               = document.getElementById('vName').value.trim();
  const category           = document.getElementById('vCategory').value;
  const pricePerDay        = parseInt(document.getElementById('vPrice').value);
  const seats              = parseInt(document.getElementById('vSeats').value);
  const fuel               = document.getElementById('vFuel').value;
  const transmission       = document.getElementById('vTransmission').value;
  const location           = document.getElementById('vLocation').value.trim();
  const registrationNumber = document.getElementById('vReg').value.trim();
  const description        = document.getElementById('vDesc').value.trim();
  const imageUrl           = document.getElementById('vImage').value.trim();
  const icon               = getIcon(category);

  if (!name || !pricePerDay || !seats || !location) { showToast('Please fill required fields'); return; }

  const body = { name, category, pricePerDay, seats, fuel, transmission, location, registrationNumber, description, imageUrl, icon };
  const editId = document.getElementById('editVehicleId').value;

  try {
    if (editId) await api.put(`/vehicles/${editId}`, body);
    else        await api.post('/vehicles', body);
    closeModal('vehicleFormModal');
    renderAdminVehicles();
    renderVehicleGrid();
    showToast(editId ? 'Vehicle updated!' : 'Vehicle added!');
  } catch (err) { showToast(err.message); }
}

async function toggleAvailability(vid) {
  try {
    const { data } = await api.patch(`/vehicles/${vid}/availability`);
    renderAdminVehicles();
    renderVehicleGrid();
    showToast(`Vehicle ${data.available ? 'enabled' : 'disabled'}`);
  } catch (err) { showToast(err.message); }
}

async function deleteVehicle(vid) {
  if (!confirm('Delete this vehicle? This cannot be undone.')) return;
  try {
    await api.delete(`/vehicles/${vid}`);
    renderAdminVehicles();
    renderVehicleGrid();
    showToast('Vehicle deleted');
  } catch (err) { showToast(err.message); }
}

// ===================== ADMIN — BOOKINGS =====================
async function renderAdminBookings() {
  const filter    = document.getElementById('bookingStatusFilter').value;
  const params    = filter ? `?status=${filter}` : '';
  const statusColors = { Confirmed:'badge-blue', Paid:'badge-green', Active:'badge-green', Completed:'badge-gray', Cancelled:'badge-red' };

  try {
    const { data: bookings } = await api.get(`/bookings${params}`);
    document.getElementById('adminBookingsBody').innerHTML = bookings.map(b => `
      <tr>
        <td class="font-mono text-label-sm text-on-surface-variant">${b._id.slice(-6).toUpperCase()}</td>
        <td>${b.customer?.name || '—'}</td>
        <td>${b.vehicle?.name  || '—'}</td>
        <td class="text-label-sm">${formatDate(b.pickupDate)} → ${formatDate(b.returnDate)}<br><span class="text-on-surface-variant">${b.days} day${b.days > 1 ? 's' : ''}</span></td>
        <td class="font-semibold text-primary">₹${fmt(b.total)}</td>
        <td>${b.paymentMethod}</td>
        <td><span class="badge ${statusColors[b.status] || 'badge-gray'}">${b.status}</span></td>
        <td><div class="flex gap-1 flex-wrap">
          <button onclick="viewBookingDetail('${b._id}')" class="px-2 py-1 bg-primary-container text-on-primary-container rounded text-label-sm hover:bg-primary hover:text-on-primary">View</button>
          ${b.status === 'Confirmed' ? `<button onclick="updateBookingStatus('${b._id}','Paid')" class="px-2 py-1 bg-primary text-on-primary rounded text-label-sm">Mark Paid</button>` : ''}
          ${b.status === 'Paid' ? `<button onclick="updateBookingStatus('${b._id}','Active')" class="px-2 py-1 bg-secondary-container text-on-secondary-container rounded text-label-sm">Activate</button>` : ''}
          ${b.status === 'Active'    ? `<button onclick="updateBookingStatus('${b._id}','Completed')" class="px-2 py-1 bg-tertiary-fixed rounded text-label-sm">Complete</button>` : ''}
          ${['Confirmed','Active'].includes(b.status) ? `<button onclick="updateBookingStatus('${b._id}','Cancelled')" class="px-2 py-1 border border-error/30 text-error rounded text-label-sm hover:bg-error-container">Cancel</button>` : ''}
        </div></td>
      </tr>`).join('') || '<tr><td colspan="8" class="text-center text-on-surface-variant py-4">No bookings</td></tr>';
  } catch (err) { console.error(err); }
}

async function viewBookingDetail(bid) {
  try {
    const { data: b } = await api.get(`/bookings/${bid}`);
    const statusColors = { Confirmed:'badge-blue', Paid:'badge-green', Active:'badge-green', Completed:'badge-gray', Cancelled:'badge-red' };
    document.getElementById('bookingDetailContent').innerHTML = `
      <div class="flex flex-col gap-2">
        <div class="flex justify-between"><span class="text-label-sm text-on-surface-variant">Booking ID</span><span class="font-mono text-label-sm">${b._id.slice(-6).toUpperCase()}</span></div>
        <div class="flex justify-between"><span class="text-label-sm text-on-surface-variant">Customer</span><span class="text-label-md">${b.customer?.name}</span></div>
        <div class="flex justify-between"><span class="text-label-sm text-on-surface-variant">Email</span><span class="text-label-sm">${b.customer?.email}</span></div>
        <div class="flex justify-between"><span class="text-label-sm text-on-surface-variant">Vehicle</span><span class="text-label-md">${b.vehicle?.name}</span></div>
        <div class="flex justify-between"><span class="text-label-sm text-on-surface-variant">Pickup</span><span class="text-label-md">${formatDate(b.pickupDate)}</span></div>
        <div class="flex justify-between"><span class="text-label-sm text-on-surface-variant">Return</span><span class="text-label-md">${formatDate(b.returnDate)}</span></div>
        <div class="flex justify-between"><span class="text-label-sm text-on-surface-variant">Duration</span><span class="text-label-md">${b.days} day${b.days > 1 ? 's' : ''}</span></div>
        <div class="flex justify-between"><span class="text-label-sm text-on-surface-variant">Location</span><span class="text-label-md">${b.location}</span></div>
        <div class="flex justify-between"><span class="text-label-sm text-on-surface-variant">Payment</span><span class="text-label-md">${b.paymentMethod}</span></div>
        <div class="flex justify-between border-t border-outline-variant pt-3 mt-1"><span class="text-label-md font-bold">Total</span><span class="text-label-md font-bold text-primary">₹${fmt(b.total)}</span></div>
        <div class="flex justify-between"><span class="text-label-sm text-on-surface-variant">Status</span><span class="badge ${statusColors[b.status] || 'badge-gray'}">${b.status}</span></div>
      </div>`;
    openModal('bookingDetailModal');
  } catch (err) { showToast('Could not load booking'); }
}

async function updateBookingStatus(bid, status) {
  try {
    await api.patch(`/bookings/${bid}/status`, { status });
    renderAdminBookings();
    refreshAdminData();
    showToast(`Booking marked as ${status}`);
  } catch (err) { showToast(err.message); }
}

// ===================== ADMIN — CUSTOMERS =====================
async function renderAdminCustomers() {
  try {
    const { data: customers } = await api.get('/admin/customers');
    document.getElementById('adminCustomersBody').innerHTML = customers.map(c => `
      <tr>
        <td><div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">${c.name[0]}</div>
          <span class="font-medium">${c.name}</span>
        </div></td>
        <td>${c.email}</td>
        <td>${c.phone || '—'}</td>
        <td>${c.bookingCount}</td>
        <td class="font-semibold text-primary">₹${fmt(c.totalSpent)}</td>
        <td class="text-label-sm text-on-surface-variant">${formatDate(c.createdAt)}</td>
      </tr>`).join('') || '<tr><td colspan="6" class="text-center text-on-surface-variant py-4">No customers yet</td></tr>';
  } catch (err) { console.error(err); }
}

// ===================== ADMIN — EARNINGS =====================
async function renderEarnings() {
  try {
    const { data } = await api.get('/admin/stats');
    document.getElementById('earnMonth').textContent = '₹' + fmt(data.monthRevenue);
    document.getElementById('earnYear').textContent  = '₹' + fmt(data.yearRevenue);
    document.getElementById('earnTotal').textContent = '₹' + fmt(data.allRevenue);
    document.getElementById('earningsByVehicle').innerHTML = (data.earningsByVehicle || []).map(e => `
      <tr>
        <td class="font-medium">${e.vehicleName}</td>
        <td>${e.count}</td>
        <td class="font-semibold text-primary">₹${fmt(e.totalRevenue)}</td>
      </tr>`).join('') || '<tr><td colspan="3" class="text-center text-on-surface-variant py-4">No earnings yet</td></tr>';
  } catch (err) { console.error(err); }
}

// ===================== ADMIN — REVIEWS =====================
async function renderAdminReviews() {
  const list  = document.getElementById('adminReviewsList');
  const noMsg = document.getElementById('noReviewsMsg');
  try {
    const { data: reviews } = await api.get('/reviews');
    if (!reviews.length) { list.innerHTML = ''; noMsg.classList.remove('hidden'); return; }
    noMsg.classList.add('hidden');
    list.innerHTML = reviews.map(r => {
      const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
      return `<div class="glass-card p-5 rounded-xl">
        <div class="flex items-start justify-between gap-4 mb-2">
          <div>
            <p class="text-label-md font-semibold text-on-surface">${r.customer?.name || '—'}</p>
            <p class="text-label-sm text-on-surface-variant">${r.vehicle?.name || '—'}</p>
          </div>
          <div class="flex flex-col items-end gap-1">
            <span class="text-amber-500 text-lg tracking-tighter">${stars}</span>
            <span class="text-label-sm text-on-surface-variant">${formatDate(r.createdAt)}</span>
          </div>
        </div>
        ${r.text ? `<p class="text-body-md text-on-surface">${r.text}</p>` : '<p class="text-label-sm text-on-surface-variant italic">No text review</p>'}
      </div>`;
    }).join('');
  } catch (err) { console.error(err); }
}

// ===================== ADMIN — SUPPORT TICKETS =====================
async function renderAdminTickets() {
  const statusF   = document.getElementById('ticketStatusFilter').value;
  const priorityF = document.getElementById('ticketPriorityFilter').value;
  const params    = new URLSearchParams();
  if (statusF)   params.append('status',   statusF);
  if (priorityF) params.append('priority', priorityF);

  const list  = document.getElementById('adminTicketsList');
  const noMsg = document.getElementById('noAdminTicketsMsg');
  const priorityColors = { High:'badge-red', Medium:'badge-yellow', Low:'badge-green' };
  const statusColors   = { Open:'badge-blue', 'In Progress':'badge-yellow', Resolved:'badge-green', Closed:'badge-gray' };

  try {
    const { data: tickets } = await api.get(`/tickets?${params}`);
    if (!tickets.length) { list.innerHTML = ''; noMsg.classList.remove('hidden'); return; }
    noMsg.classList.add('hidden');
    list.innerHTML = tickets.map(t => `
      <div class="glass-card p-5 rounded-xl">
        <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <span class="font-mono text-label-sm text-on-surface-variant">#${t._id.slice(-6).toUpperCase()}</span>
              <span class="badge ${priorityColors[t.priority] || 'badge-gray'}">${t.priority}</span>
              <span class="badge ${statusColors[t.status] || 'badge-gray'}">${t.status}</span>
              <span class="badge badge-gray">${t.category}</span>
            </div>
            <h4 class="text-label-md font-semibold text-on-surface mb-1">${t.subject}</h4>
            <p class="text-label-sm text-on-surface-variant mb-2">From: <span class="font-medium text-on-surface">${t.customerName}</span> &lt;${t.customerEmail}&gt;${t.bookingRef ? ` · Booking: ${t.bookingRef}` : ''}</p>
            <p class="text-body-md text-on-surface-variant">${t.message}</p>
            ${t.replies.length ? `<p class="text-label-sm text-primary mt-2">${t.replies.length} repl${t.replies.length === 1 ? 'y' : 'ies'}</p>` : ''}
          </div>
          <div class="flex flex-col gap-2 items-end flex-shrink-0">
            <p class="text-label-sm text-on-surface-variant">${formatDate(t.createdAt)}</p>
            <button onclick="openTicketReply('${t._id}')" class="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-sm hover:opacity-90 flex items-center gap-2">
              <span class="material-symbols-outlined text-base">reply</span> Reply
            </button>
            ${t.status === 'Open'        ? `<button onclick="quickUpdateTicket('${t._id}','In Progress')" class="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-lg text-label-sm">Mark In Progress</button>` : ''}
            ${t.status === 'In Progress' ? `<button onclick="quickUpdateTicket('${t._id}','Resolved')" class="px-4 py-2 bg-tertiary-fixed rounded-lg text-label-sm">Mark Resolved</button>` : ''}
          </div>
        </div>
      </div>`).join('');
  } catch (err) { console.error(err); }
}

async function openTicketReply(tid) {
  activeTicketId = tid;
  const priorityColors = { High:'badge-red', Medium:'badge-yellow', Low:'badge-green' };
  const statusColors   = { Open:'badge-blue', 'In Progress':'badge-yellow', Resolved:'badge-green', Closed:'badge-gray' };
  try {
    const { data: tickets } = await api.get('/tickets');
    const t = tickets.find(x => x._id === tid);
    if (!t) return;
    document.getElementById('ticketDetailContent').innerHTML = `
      <div class="flex flex-col gap-2 mb-4">
        <div class="flex flex-wrap gap-2 mb-1">
          <span class="font-mono text-label-sm text-on-surface-variant">#${t._id.slice(-6).toUpperCase()}</span>
          <span class="badge ${priorityColors[t.priority] || 'badge-gray'}">${t.priority}</span>
          <span class="badge ${statusColors[t.status] || 'badge-gray'}">${t.status}</span>
        </div>
        <h3 class="text-label-md font-semibold text-on-surface">${t.subject}</h3>
        <p class="text-label-sm text-on-surface-variant">From: ${t.customerName} &lt;${t.customerEmail}&gt;</p>
        <div class="bg-surface-container-low rounded-lg p-4 mt-2"><p class="text-body-md text-on-surface">${t.message}</p></div>
      </div>
      ${t.replies.length ? `
        <div class="border-t border-outline-variant/40 pt-4 mb-2">
          <p class="text-label-sm text-on-surface-variant mb-3">Previous replies:</p>
          <div class="flex flex-col gap-3">
            ${t.replies.map(r => `<div class="bg-primary-fixed/60 rounded-lg px-4 py-3">
              <p class="text-label-sm font-semibold text-primary mb-1">Support Team · ${formatDate(r.at)}</p>
              <p class="text-body-md text-on-surface">${r.text}</p>
            </div>`).join('')}
          </div>
        </div>` : ''}`;
    document.getElementById('ticketReplyText').value    = '';
    document.getElementById('ticketStatusUpdate').value = t.status;
    openModal('ticketReplyModal');
  } catch (err) { showToast('Could not load ticket'); }
}

async function sendTicketReply() {
  const text   = document.getElementById('ticketReplyText').value.trim();
  const status = document.getElementById('ticketStatusUpdate').value;
  if (!text) { showToast('Please type a reply'); return; }
  try {
    await api.patch(`/tickets/${activeTicketId}/reply`, { text, status });
    closeModal('ticketReplyModal');
    renderAdminTickets();
    refreshAdminData();
    showToast('Reply sent & status updated');
  } catch (err) { showToast(err.message); }
}

async function quickUpdateTicket(tid, status) {
  try {
    await api.patch(`/tickets/${tid}/status`, { status });
    renderAdminTickets();
    refreshAdminData();
    showToast(`Ticket marked as ${status}`);
  } catch (err) { showToast(err.message); }
}

// ===================== LOCATION PICKER =====================
function openLocationPicker(target) {
  locationPickerTarget = target;
  pickerStep = 'state';
  pickerSelectedState = '';
  document.getElementById('locationSearch').value = '';
  document.getElementById('stateListPanel').classList.remove('hidden');
  document.getElementById('cityListPanel').classList.add('hidden');
  setStepUI(1);
  renderStateList();
  openModal('locationPickerModal');
}

function setStepUI(step) {
  const d1 = document.getElementById('stepDot1'), d2 = document.getElementById('stepDot2');
  const l1 = document.getElementById('stepLabel1'), l2 = document.getElementById('stepLabel2');
  if (step === 1) {
    d1.className = 'w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold';
    l1.className = 'text-label-sm font-semibold text-primary';
    d2.className = 'w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center text-xs font-bold';
    l2.className = 'text-label-sm text-on-surface-variant';
  } else {
    d1.className = 'w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-xs font-bold';
    l1.className = 'text-label-sm text-on-surface-variant';
    d2.className = 'w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold';
    l2.className = 'text-label-sm font-semibold text-primary';
  }
}

function renderStateList(filter = '') {
  const states = Object.keys(INDIA_LOCATIONS).filter(s => !filter || s.toLowerCase().includes(filter.toLowerCase())).sort();
  document.getElementById('stateList').innerHTML = states.map(s => `
    <button onclick="selectState('${s}')" class="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-surface-container-low transition-colors text-left w-full group">
      <div class="flex items-center gap-3">
        <span class="material-symbols-outlined text-primary text-base">map</span>
        <span class="text-body-md text-on-surface group-hover:text-primary">${s}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-label-sm text-on-surface-variant">${INDIA_LOCATIONS[s].length} cities</span>
        <span class="material-symbols-outlined text-on-surface-variant text-base">chevron_right</span>
      </div>
    </button>`).join('');
}

function selectState(state) {
  pickerSelectedState = state;
  pickerStep = 'city';
  document.getElementById('locationSearch').value = '';
  document.getElementById('selectedStateName').textContent = state;
  document.getElementById('stateListPanel').classList.add('hidden');
  document.getElementById('cityListPanel').classList.remove('hidden');
  setStepUI(2);
  renderCityList();
}

function renderCityList(filter = '') {
  const cities = (INDIA_LOCATIONS[pickerSelectedState] || []).filter(c => !filter || c.toLowerCase().includes(filter.toLowerCase())).sort();
  document.getElementById('cityList').innerHTML = cities.map(c => `
    <button onclick="selectCity('${c}')" class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-container-low transition-colors text-left w-full group">
      <span class="material-symbols-outlined text-secondary text-base">location_city</span>
      <span class="text-body-md text-on-surface group-hover:text-primary">${c}</span>
    </button>`).join('');
}

function selectCity(city) {
  const full = `${city}, ${pickerSelectedState}`;
  if (locationPickerTarget === 'search') {
    document.getElementById('searchLocation').value = city;
    const d = document.getElementById('searchLocationDisplay');
    d.textContent = full;
    d.classList.replace('text-on-surface-variant', 'text-on-surface');
  } else {
    document.getElementById('bookLocation').value = full;
    const d = document.getElementById('bookLocationDisplay');
    d.textContent = full;
    d.classList.replace('text-on-surface-variant', 'text-on-surface');
  }
  closeModal('locationPickerModal');
  if (locationPickerTarget === 'search') renderVehicleGrid();
}

function backToStates() {
  pickerStep = 'state';
  document.getElementById('locationSearch').value = '';
  document.getElementById('cityListPanel').classList.add('hidden');
  document.getElementById('stateListPanel').classList.remove('hidden');
  setStepUI(1);
  renderStateList();
}

function filterLocationList() {
  const q = document.getElementById('locationSearch').value;
  if (pickerStep === 'state') renderStateList(q);
  else renderCityList(q);
}

// ===================== BOOT =====================
updateAuthUI();
showCustomerPage('home');
renderVehicleGrid();
renderOffers();
