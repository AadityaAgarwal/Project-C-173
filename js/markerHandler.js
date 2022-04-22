var userId = null;

AFRAME.registerComponent("markerhandler", {
  init: async function () {
    if (userId === null) {
      this.askuserId();
    }

    var toys = await this.gettoys();

    this.el.addEventListener("markerFound", () => {
      if (userId !== null) {
        var markerId = this.el.id;
        this.handleMarkerFound(toys, markerId);
      }
    });

    this.el.addEventListener("markerLost", () => {
      this.handleMarkerLost();
    });
  },

  askuserId: function () {
    var iconUrl = "https://raw.githubusercontent.com/whitehatjr/menu-card-app/main/hunger.png";

    swal({
      title: "Welcome to AR-Toy-Store!!",
      icon: iconUrl,
      content: {
        element: "input",
        attributes: {
          placeholder: "Type your user id",
          type: "number",
          min: 1
        }
      }
    }).then(inputValue => {
      userId = inputValue;
    });
  },

  handleMarkerFound: function (toys, markerId) {
    // Getting today's day
    var todaysDate = new Date();
    var todaysDay = todaysDate.getDay();
    // Sunday - Saturday : 0 - 6
    var days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday"
    ];

    // Changing Model scale to initial scale
    var toy = toys.filter(toy => toy.id === markerId)[0];

    if (toy.unavailable_days.includes(days[todaysDay])) {
      swal({
        icon: "warning",
        title: toy.toy_name.toUpperCase(),
        text: "This toy is not available today!!!",
        timer: 2500,
        buttons: false
      });
    } else {
      // make model visible
      var model = document.querySelector(`#model-${toy.id}`);

      model.setAttribute("visible", true);

      // make description Container visible
      var descriptionContainer = document.querySelector(
        `#main-plane-${toy.id}`
      );
      descriptionContainer.setAttribute("visible", true);

      // make Price Plane visible
      var pricePlane = document.querySelector(`#price-plane-${toy.id}`);
      pricePlane.setAttribute("visible", true);

      // make Rating Plane visible
      var ratingPlane = document.querySelector(`#rating-plane-${toy.id}`);
      ratingPlane.setAttribute("visible", true);

      var ratingPlaneElement=document.createElement('')

      // make review Plane visible
      var reviewPlane = document.querySelector(`#review-plane-${toy.id}`);
      reviewPlane.setAttribute("visible", true);


      var model = document.querySelector(`#model-${toy.id}`);
      model.setAttribute("position", toy.model_geometry.position);
      model.setAttribute("rotation", toy.model_geometry.rotation);
      model.setAttribute("scale", toy.model_geometry.scale);

      // Changing button div visibility
      var buttonDiv = document.getElementById("button-div");
      buttonDiv.style.display = "flex";

      var ratingButton = document.getElementById("rating-button");
      var orderButtton = document.getElementById("order-button");
      var orderSummaryButtton = document.getElementById("order-summary-button");
      var payButton = document.getElementById("pay-button");

      // Handling Click Events
      ratingButton.addEventListener("click", () => this.handleRatings(toy));

      orderButtton.addEventListener("click", () => {
        var uId;
        userId <= 9 ? (uId = `T0${userId}`) : `T${userId}`;
        this.handleOrder(uId, toy);

        swal({
          icon: "https://i.imgur.com/4NZ6uLY.jpg",
          title: "Thanks For Order !",
          text: "Your order will be delivered soon!",
          timer: 2000,
          buttons: false
        });
      });

      orderSummaryButtton.addEventListener("click", () =>
        this.handleOrderSummary()
      );

      payButton.addEventListener("click", () => this.handlePayment());
    }
  },
  
  handleOrder: function (uId, toy) {
    // Reading currnt table order details
    firebase
      .firestore()
      .collection("users")
      .doc(uId)
      .get()
      .then(doc => {
        var details = doc.data();

        if (details["current_orders"][toy.id]) {
          // Increasing Current Quantity
          details["current_orders"][toy.id]["quantity"] += 1;

          //Calculating Subtotal of item
          var currentQuantity = details["current_orders"][toy.id]["quantity"];

          details["current_orders"][toy.id]["subtotal"] =
            currentQuantity * toy.price;
        } else {
          details["current_orders"][toy.id] = {
            item: toy.toy_name,
            price: toy.price,
            quantity: 1,
            subtotal: toy.price * 1
          };
        }

        details.total_bill += toy.price;

        // Updating Db
        firebase
          .firestore()
          .collection("users")
          .doc(doc.id)
          .update(details);
      });
  },
  gettoys: async function () {
    return await firebase
      .firestore()
      .collection("toys")
      .get()
      .then(snap => {
        return snap.docs.map(doc => doc.data());
      });
  },
  
  handleOrderSummary: async function () {
    // Changing modal div visibility
    var modalDiv = document.getElementById("modal-div");
    modalDiv.style.display = "flex";

    var tableBodyTag = document.getElementById("bill-table-body");

    // Removing old tr data
    tableBodyTag.innerHTML = "";

    // Getting user id
    var uId;
    userId <= 9 ? (uId = `T0${userId}`) : `T${userId}`;

    // Getting Order Summary from database
    var orderSummary = await this.getOrderSummary(uId);

    var currentOrders = Object.keys(orderSummary.current_orders);

    currentOrders.map(i => {
      var tr = document.createElement("tr");
      var item = document.createElement("td");
      var price = document.createElement("td");
      var quantity = document.createElement("td");
      var subtotal = document.createElement("td");

      item.innerHTML = orderSummary.current_orders[i].item;
      price.innerHTML = "$" + orderSummary.current_orders[i].price;
      price.setAttribute("class", "text-center");

      quantity.innerHTML = orderSummary.current_orders[i].quantity;
      quantity.setAttribute("class", "text-center");

      subtotal.innerHTML = "$" + orderSummary.current_orders[i].subtotal;
      subtotal.setAttribute("class", "text-center");

      tr.appendChild(item);
      tr.appendChild(price);
      tr.appendChild(quantity);
      tr.appendChild(subtotal);
      tableBodyTag.appendChild(tr);
    });

    var totalTr = document.createElement("tr");

    var td1 = document.createElement("td");
    td1.setAttribute("class", "no-line");

    var td2 = document.createElement("td");
    td1.setAttribute("class", "no-line");

    var td3 = document.createElement("td");
    td1.setAttribute("class", "no-line text-cente");

    var strongTag = document.createElement("strong");
    strongTag.innerHTML = "Total";
    td3.appendChild(strongTag);

    var td4 = document.createElement("td");
    td1.setAttribute("class", "no-line text-right");
    td4.innerHTML = "$" + orderSummary.total_bill;

    totalTr.appendChild(td1);
    totalTr.appendChild(td2);
    totalTr.appendChild(td3);
    totalTr.appendChild(td4);

    tableBodyTag.appendChild(totalTr);
  },
  handlePayment: function () {
    // Close Modal
    document.getElementById("modal-div").style.display = "none";

    // Getting user id
    var uId;
    userId <= 9 ? (uId = `T0${userId}`) : `T${userId}`;

    // Reseting current orders and total bill
    firebase
      .firestore()
      .collection("users")
      .doc(uId)
      .update({
        current_orders: {},
        total_bill: 0
      })
      .then(() => {
        swal({
          icon: "success",
          title: "Thanks For Paying !",
          text: "We Hope You Enjoy Our Product !!",
          timer: 2500,
          buttons: false
        });
      });
  },

  handleRatings: async function (toy) { 
    var uId;
    userId <= 9 ? (uId = `T0${userId}`) : `T${userId}`;
    var order_sum=await this.getOrderSummary(uId)

    var currentorders=Object.keys(order_sum.current_orders)

    if(currentorders.length>0 && currentorders==toy.id){
      document.getElementById('rating-modal-div').style.display='flex';
      document.getElementById('rating-input').value='0';
      document.getElementById('feedback-input').value='';
      var rating_button=document.getElementById('save-rating-button');
      rating_button.addEventListener('click',()=>{
        document.getElementById('rating-modal-div').style.display='none';
        var rating=document.getElementById('rating-input').value;
        var feedback=document.getElementById('feedback-input').value;

        firebase.firestore()
        .collection('toys')
        .doc(toy.id)
        .update({last_rating:rating,feedback:feedback,})
        .then(()=>{
          swal({
            icon:"success",
            text:"Hope you liked the toy!!",
            title:'Thanks for rating.',
            buttons:false,
            timer:2500,
          })
        })
        
      });
    }
    else{
      swal({
        icon:'warning',
        text:'No toy found',
        title:'OOPS!!',
        buttons:false,
        timer:2500,
      })
    }
  },
  handleMarkerLost: function () {
    // Changing button div visibility
    var buttonDiv = document.getElementById("button-div");
    buttonDiv.style.display = "none";
  },

  getOrderSummary: async function (uId) {
    return await firebase
      .firestore()
      .collection("users")
      .doc(uId)
      .get()
      .then(doc => doc.data());
  },
});
