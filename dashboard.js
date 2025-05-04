const reserveForm = document.getElementById('reserveForm');
const reservedSpotsList = document.getElementById('reservedSpotsList');

let reservedSpots = JSON.parse(localStorage.getItem("reservedSpots")) || {};

reserveForm.addEventListener('submit', function(e) {
  e.preventDefault();

  const vehicleNumber = document.getElementById('vehicleNumber').value.trim();
  const spotNumber = document.getElementById('spotNumber').value.trim();
  const fromTime = new Date(document.getElementById('fromTime').value);
  const toTime = new Date(document.getElementById('toTime').value);

  if (fromTime >= toTime) {
    alert("End time must be after start time.");
    return;
  }

  const duration = (toTime - fromTime) / (1000 * 60 * 60);
  const hours = Math.ceil(duration);

  const spotKey = `Spot ${spotNumber}`;

  if (!reservedSpots[spotKey]) reservedSpots[spotKey] = [];

  // Overlap check
  const overlap = reservedSpots[spotKey].some(reservation => {
    return !(toTime <= new Date(reservation.start) || fromTime >= new Date(reservation.end));
  });

  if (overlap) {
    alert("This time slot is already booked!");
    return;
  }

  const booking = {
    vehicle: vehicleNumber,
    start: fromTime.toISOString(),
    end: toTime.toISOString(),
    hours: hours
  };

  reservedSpots[spotKey].push(booking);
  localStorage.setItem("reservedSpots", JSON.stringify(reservedSpots));

  renderReservations();

  // Allow cancel within 15 seconds
  alert("Reservation successful! You have 15 seconds to cancel.");
  setTimeout(() => {
    triggerPayment(hours);
  }, 15000);
});

function renderReservations() {
  reservedSpotsList.innerHTML = "";
  for (const spot in reservedSpots) {
    reservedSpots[spot].forEach((res, index) => {
      const li = document.createElement('li');
      li.className = "bg-green-100 p-4 rounded flex justify-between items-center";
      li.innerHTML = `
        <div>
          <div><strong>${spot}</strong> - ${res.vehicle}</div>
          <div class="text-xs">${new Date(res.start).toLocaleString()} → ${new Date(res.end).toLocaleString()}</div>
          <div class="text-xs">Duration: ${res.hours} hour(s)</div>
        </div>
        <button onclick="cancelReservation('${spot}', ${index})" class="bg-red-500 text-white px-2 py-1 rounded">Cancel</button>
      `;
      reservedSpotsList.appendChild(li);
    });
  }
}

function cancelReservation(spot, index) {
  reservedSpots[spot].splice(index, 1);
  if (reservedSpots[spot].length === 0) delete reservedSpots[spot];
  localStorage.setItem("reservedSpots", JSON.stringify(reservedSpots));
  renderReservations();
}

function triggerPayment(hours) {
  const amount = hours * 20 * 100; // ₹20 per hour, in paise
  const options = {
    "key": "rzp_test_yQ8sKvUS72HreR",
    "amount": amount,
    "currency": "INR",
    "name": "Smart Parking System",
    "description": "Slot Booking Payment",
    "handler": function (response){
      alert("Payment successful! Payment ID: " + response.razorpay_payment_id);
    },
    "theme": {
      "color": "#3399cc"
    }
  };
  const rzp = new Razorpay(options);
  rzp.open();
}

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// Initial render
renderReservations();
