// inicializa as variáveis
var map;
var marker;
var infowindow;
var service;

var latitude;
var longitude;

var markers = [];

// pega a temperatura da localização atual
function getWeather(self) {
	self.temp = ko.observable();
	self.myLocation = ko.observable();
	$.ajax({
		url: 'http://api.openweathermap.org/data/2.5/weather?lat='+latitude+'&lon='+longitude+'&lang=pt&units=metric&APPID=88234a69ee98b9fb7a6c6493aef2ce79',
		type: 'GET',		
	}).done(function(data){
		self.myLocation(data.name + " - " + data.weather[0].description);
		self.temp(data.main.temp + "ºC");
	});
}


// função acionada ao carregar o javascript do google maps
function initMap() {
	// pega a posição do usuário
	if(navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position){ // callback de sucesso
		
			latitude = position.coords.latitude; // pega a latitude do usuário
			longitude = position.coords.longitude; // pega a longitude do usuário
			
			// inicializa o mapa com algumas opções
			map = new google.maps.Map(document.getElementById('map'), {
				center: {lat: latitude, lng: longitude},
				zoom: 15
			});
			
			// adiciona o marker da posição atual
			marker = new google.maps.Marker({
				map: map,
				position: {lat: latitude, lng: longitude},
				animation: google.maps.Animation.BOUNCE
			});
			
			// adiciona o info da posição atual
			google.maps.event.addListener(marker, 'click', function() {
				infowindow.setContent("Minha Localização");
				infowindow.open(map, this);
			});
			
			// inicializa o knockout
			ko.applyBindings(new MyViewModel());
		}, function(error){ // callback de erro
		   alert('Erro ao obter localização!');
		   console.log('Erro ao obter localização.', error);
		});
	} else {
		alert('Navegador não suporta Geolocalização!');
	}			
}

// adiciona os markers dos locais no mapa
function createMarker(place, self) 
{		
	// adiciona informação extra do foursquare
	$.ajax({
		url: 'https://api.foursquare.com/v2/venues/search?client_id=DIMPKPOCLGUA50Y2SXLYH1L4BXWVWAAV15VLKO2VIDGL3YGV&client_secret=3HUKKNO1CR3P0AJD4MC1CAUXCO02POPGU0TTLS4H3YSG23DR&v=20130815&ll='+place.geometry.location.lat()+','+place.geometry.location.lng()+'&query='+place.name+'&limit=1',
		type: 'GET',
	}).done(function(data){
		var marker = new google.maps.Marker({
			map: map,
			position: place.geometry.location,
		});
		var site = data.response.venues[0].url;
		var content = place.name+"<br>Telefone: "+data.response.venues[0].contact.formattedPhone+"<br>Endereço: "+data.response.venues[0].location.formattedAddress[0]+"<br>site: <a href="+site+">"+site+"</a>";
		google.maps.event.addListener(marker, 'click', function() {
			infowindow.setContent(content);
			infowindow.open(map, this);
			map.setCenter(marker.getPosition());
			marker.setAnimation(google.maps.Animation.BOUNCE);
			setTimeout(function(){ marker.setAnimation(null); }, 1500);
		});	
		markers.push(marker); // adiciona o marcador em um array de marcadores para ser usado na função para adicionar/remover os marcadaores
		
		// adiciona o restaurante no array do viewmodel
		self.locations.push({
			location: place.name,
			position: place.geometry.location,
			placeName: place.name,
			marker: marker,
			content : content
		}); 
	}).fail(function( jqXHR, textStatus, errorThrown ){
		alert("ERRO: " + errorThrown);
	}).always(function(){
		// inicializa a função de click no link no menu lateral
		clickLink();
	});
}

// Sets the map on all markers in the array.
function setMapOnAll(map, markers) {
	for (var i = 0; i < markers.length; i++) {
		markers[i].setMap(map);
	}
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
	setMapOnAll(null, markers);
}

function MyViewModel() {
	var self = this;
	
	// pega a temperatura
	getWeather(self);
	
	self.locations = ko.observableArray([]);
	
	// options para a chamada do google places
	var request = {
		location: {lat: latitude, lng: longitude},
		radius: '2000',
		types: ['restaurant']
	};
	
	// inicializa a janela de informações
	infowindow = new google.maps.InfoWindow();
	// inicializa e faz a requisição para o google places
	service = new google.maps.places.PlacesService(map);
	service.nearbySearch(request, function(results, status){
		if (status == google.maps.places.PlacesServiceStatus.OK) {
			for (var i = 0; i < results.length; i++) {
				createMarker(results[i], self) // adiciona o marker para cada restaurante						
			}
		}
	});
					
	// parâmetro do filtro de procura
	self.paramFilter = ko.observable();
	
	// filtra as localizações
	self.filteredLocations = ko.computed(function(){
		 if (!self.paramFilter()) {
			setMapOnAll(map, markers); // seta todos os markers no mapa
			return self.locations(); // se não houver nenhum termo de procura retorna a lista inteira
		} else {
			clearMarkers(); // limpa todos os markers do mapa
			var arrayLocation = ko.utils.arrayFilter(self.locations(), function (loc) {
				var regExp = new RegExp(self.paramFilter(), 'ig'); // expressão regular para retornar o termo procurado em qualquer lugar da localização
				return regExp.test(loc.location)
			});
			
			// cria um array para mostrar somente os markers do termo procurado
			var arrayMarkers = [];
			for(var i = 0; i < arrayLocation.length; i++) {
				arrayMarkers.push(arrayLocation[i].marker);
			}
			// seta os markers do termo procurado
			setMapOnAll(map, arrayMarkers);
			return arrayLocation; // retorna o termo procurado
		}
	});
	  
	// função executada ao clicar no botão filtrar
	self.filtrar = function() {				
		self.paramFilter();		
	}	

	// centraliza e abre a janela de info ao clicar no link no menu lateral
	self.jumpMap = function(index) {
		map.panTo(self.filteredLocations()[index].position);
		self.filteredLocations()[index].marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function(){self.filteredLocations()[index].marker.setAnimation(null); }, 1500);
		infowindow.setContent(self.filteredLocations()[index].content);
		infowindow.open(map, self.filteredLocations()[index].marker);					
	}
}

// função para esconder/mostrar o menu lateral esquerdo
function toggleNav() {
	if($("#main").hasClass("open-sidebar")) {
		$("#mySidenav").css("width", "0");
		$("#main").css("marginLeft", "0");
		$("#main").removeClass("open-sidebar");
		$("#main").addClass("close-sidebar");
	} else {
		$("#mySidenav").css("width", "250px");
		$("#main").css("marginLeft", "250px");
		$("#main").removeClass("close-sidebar");
		$("#main").addClass("open-sidebar");
	}			
}

// função para ao clicar no link adicionar a classe active para o elemento clicado
function toggleLink(self) {
	$(".link-map").each(function(index, element){
		$(this).removeClass("active");				
	})
	self.addClass("active");	
}

// adiciona o evento de click no link do menu lateral esquerdo
function clickLink() {						
	$(".link-map").on("click", function(e){
		e.preventDefault();
		toggleLink($(this));
	});
}