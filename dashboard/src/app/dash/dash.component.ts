import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from 'angularfire2/firestore';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AuthService } from '../shared/auth.service';
import { Observable } from 'rxjs';
import { AngularFireDatabase } from 'angularfire2/database';
import { MatGridTile } from '@angular/material';
import { Chart } from 'chart.js';
import * as firebase from 'firebase/app';
import { Injectable } from '@angular/core';

@Component({
  selector: 'app-dash',
  templateUrl: './dash.component.html',
  styleUrls: ['./dash.component.css']
})
export class DashComponent implements OnInit {
  user = null;
  items: Observable<any[]>;
  data: Observable<any[]>;
  clients: Observable<any[]>;
  drivers: Observable<any[]>;

  tripsWeek: Observable<any[]>;
  clientsWeek: Observable<any[]>;
  driversWeek: Observable<any[]>;
  topClients = [{'l': 'Massa Consulting'}, {'l': 'Massa Consulting'}, {'l': 'Massa Consulting'}];

  month = {"num": 0,
  "days": 0,
  "year": 0,
  "last": '',
  "first": ''};
  public chart = Chart;
  chart2 = Chart;


  constructor(private auth: AuthService, public db: AngularFireDatabase) {}

  ngOnInit() {
    this.auth.getAuthState().subscribe(
      (user) => this.user = user);

      this.initDates();
      this.initData();


      //    db.list('/items', ref => ref.orderByChild('size').equalTo('large'))
    }

    ngAfterViewInit() {
      this.initChart();
      this.initBubbleChart();
      cosa(this.chart);

    }


    initDates(){
      this.month.num = new Date().getMonth()+1;
      this.month.year = new Date().getFullYear();
      var x = new Date(this.month.year, this.month.num, 0);
      this.month.last = x.getTime().toString();
      this.month.first = new Date(this.month.year, this.month.num-1, 1).getTime().toString();
      this.month.days = x.getDate();
    }

    calcWeek(cat, field): Observable<any[]>{
      var dte = + new Date()
      return this.db.list(cat, ref => ref.orderByChild(field).startAt((dte-6.048e+8).toString()).endAt(dte.toString())).valueChanges();
    }
    calcMonth(): number[]{
      var x = Array.from({ length: this.month.days }, () => 0);
      var temp = this.db.list('/data', ref => ref.orderByChild('iTime').startAt(this.month.first).endAt(this.month.last)).valueChanges();
      temp.subscribe(items => {
        items.forEach(item => {
          var tm = (new Date(parseInt(item.iTime)*1000)).getDate();
          x[tm-1] += 1;
        });
      });


      return x;

    }

    calcHoursDay() : Object[]{
      const x = [];
      var lbl = ["Lunes","Martes","Miercoles","Jueves","Viernes","Sabado","Domingo"];
      var temp = this.db.list('/data', ref => ref.orderByChild('iTime').limitToLast(100)).valueChanges();
      temp.subscribe(items => {
        items.forEach(item => {
          var d = (new Date(parseInt(item.iTime)*1000)).getDay();
          var h = (new Date(parseInt(item.iTime)*1000)).getHours();
          const y = (x.find(p => (p.data[0].x === h && p.data[0].y === d)));
          if (y) {
            y.data[0].r += 3;
          } else {
            x.push({
              backgroundColor: "rgba(255, 140, 11,0.2)",
              borderColor: "rgba(255, 140, 11)",
              "data":[{
                "x": h, "y": d, "r": 3}]
              });
            }
          });
        }

      );

        console.log(lbl[0]);
        return x;
      }

      initData(){
        //this.drivers = this.db.list('/drivers').valueChanges();
        //this.clients = this.db.list('/clients').valueChanges();
        //this.data = this.db.list('/data').valueChanges();

        this.tripsWeek = this.calcWeek('/data', 'iTime');
        this.clientsWeek = this.calcWeek('/clients', 'iDate');
        this.driversWeek = this.calcWeek('/drivers', 'iDate');
        this.topClients = this.getTop();
      }

      getTop(): Observable<any[]> {
        var temp = this.db.list('/data').valueChanges();
        temp.subscribe(
          items => {
            items.forEach(item => {
              var tm = (new Date(parseInt(item.iTime)*1000)).getDate();
              x[tm-1] += 1;
            });
          }

        );
        return temp;
      }

      initChart(){
        this.chart = new Chart('canvas', {
          type: 'line',
          data: {
            labels: Array.from({length: this.month.days}, (v, k) => k+1) ,
            datasets: [{
              fill: true,
              lineTension: .1,
              label: 'Viajes',
              data:     this.calcMonth(),
              backgroundColor: [
                'rgba(255, 225, 11, 0.2)'
              ],
              borderColor: [
                'rgba(255, 225, 11, 1)'
              ],
              borderDash: [],
              borderDashOffset: 0.0,
              borderJoinStyle: 'miter',
              pointBorderColor: 'rgba(255, 225, 11,1)',
              pointBackgroundColor: "#fff",
              pointBorderWidth: 1,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: 'rgba(255, 225, 11, 0.2)'  ,
              pointHoverBorderColor: 'rgba(255, 225, 11, 1)',
              pointHoverBorderWidth: 2,
              pointRadius: 1,
              pointHitRadius: 10,
              spanGaps: false,
            }]
          },
          options: {

            legend: {
              display: false
            },
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero:true
                }
              }],
              xAxes: [{
                display:false
              }]
            }
          }
        });
      }

      initBubbleChart(){
        var lbs = ["Lunes","Martes","Miercoles","Jueves","Viernes","Sabado","Domingo"];
        this.chart2 = new Chart('canvas2', {
          type: 'bubble',
          data: {
            datasets: this.calcHoursDay()
          },
          options: {
            legend: {
              display: false
            },
            scales: {
              yAxes: [{
                ticks:{
                  callback: function(value, index, values) {
                    return lbs[value];
                  }
                },
                scaleLabel: {
                  display: true,
                  labelString: "Día de la semana",

                }
              }],
              xAxes: [{
                ticks: {
                  stepSize: 1,
                  max: 23
                },
                scaleLabel: {
                  display: true,
                  labelString: "Hora del día",
                  endAt: 23
                }
              }]
            }
          }
        });


      }

    }
    function cosa(x){
      window.setInterval(function(){
        x.update();
      }, 50000);
    }
