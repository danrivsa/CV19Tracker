import { Component, OnInit } from '@angular/core';
import { CovidApiService } from 'src/app/services/covid-api.service';
import { fade, slide } from '../../animations/MainAnimations';
import { ChartDataSets, ChartOptions } from 'chart.js';
import { Color, Label } from 'ng2-charts';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.css'],
  animations:[fade,slide]
})
export class SummaryComponent implements OnInit {

  //attributes
  currentDate:string='';
  listOfCountries:any[];
  listOfCases:any[];

  //total attributes
  t_deaths:number;
  t_confirmed:number;
  t_active:number;
  t_recovered:number;
  t_new:number;

  //chart data
  monthsList = ['January','Febraury','March','April','May','June','July','August','September','October','November','December'];
  monthsSet:Set<string>;
  monthsArr:string[];
  confirmedDataset:number[];
  deathsDataset:number[];
  recoveredDataset:number[];
  activeDataset:number[];
   

  //chart configuration
  public lineChartData: ChartDataSets[] = 
  [
    //y axis
    { data: [1], label: 'Confirmed' },
    { data: [5], label: 'Deaths' },
    { data: [10], label: 'Recovered' },
    { data: [15], label: 'Active' }
  ];
  public lineChartLabels: Label[] = ['January','February','March','April','May']; //x axis
  public lineChartOptions: (ChartOptions) = 
  {
    responsive: true,
  };
  public lineChartColors: Color[] = 
  [
    { //confirmed
      backgroundColor: 'rgba(204,0,0,0.3)',
      borderColor: 'rgba(204,0,0,0.8)'
    },
    {//deaths
      backgroundColor: 'rgba(17,17,17,0.3)',
      borderColor: 'rgba(17,17,17,0.8)'
    },
    {//recovered
      backgroundColor: 'rgba(51,102,255,0.3)',
      borderColor: 'rgba(51,102,255,0.8)'
    },
    {//active
      backgroundColor: 'rgba(255,255,0,0.3)',
      borderColor: 'rgba(255,255,0,0.8)'
    },
  ];
  public lineChartLegend = true;
  public lineChartType = 'line';
  public lineChartPlugins = [];

  //constructor
  constructor(private covidService:CovidApiService) { }

  //on initialization
  ngOnInit(): void 
  {
    this.currentDate=this.GetSystemDate();
    this.listOfCountries = [];
    this.GetCountryList();
    this.monthsSet = new Set();
    this.monthsArr = [];
  }

  //methods
  GetSystemDate()
  {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
    return `${mm}/${dd}/${yyyy}`;

  }

  GetCountryList()
  {
    this.covidService.GetAvailableCountries().subscribe(res=>
      {
        
        this.listOfCountries = res as any[];
        this.listOfCountries.sort((a,b)=>
        {
          if(a.Country.toLowerCase() > b.Country.toLowerCase())
            return 1;
          if(a.Country.toLowerCase() < b.Country.toLowerCase())
            return -1;
          return 0;
        });
      });
  }

  GetReportedCasesOfCountry(slug:string)
  {
    this.covidService.GetReportedCasesOfCountry(slug).subscribe(res=>
      {
        try 
        {
          this.listOfCases= res as any[];
          this.ConvertDateFormat(this.listOfCases);
          this.GetActualReportData(); 
          
        } catch (error)
        {
          alert(`Sorry, no data provided for ${slug}`);
        }
      });
  }

  GetCountrySlug(event:any)
  {
    //event.target.value returns country slug
    let slug = event.target.value;
    this.GetReportedCasesOfCountry(slug);
    this.CleanDataHolders(); //clean previous info if any
    this.lineChartLabels=this.monthsArr;
  }

  //operation methods
  CleanDataHolders()
  {
    this.listOfCases = [];
    this.t_active = 0;
    this.t_confirmed=0;
    this.t_deaths=0;
    this.t_new = 0;
    this.t_recovered=0;
    this.monthsSet= new Set();
    this.monthsArr = [];
    this.confirmedDataset=[];
    this.deathsDataset=[];
    this.recoveredDataset=[];
    this.activeDataset=[];
  }

  GetActualReportData()
  {
    let index=this.listOfCases.length-1;
    let index_alt=this.listOfCases.length-2;
    let actualCase:any = this.listOfCases[index];
    let previousCase:any = this.listOfCases[index_alt];

    this.t_confirmed=actualCase.Confirmed;
    this.t_deaths = actualCase.Deaths;
    this.t_recovered = actualCase.Recovered;
    this.t_active = actualCase.Active;

    this.t_new=actualCase.Confirmed-previousCase.Confirmed;
    this.GetDatasets();
  }

  private ConvertDateFormat(arr:any[])
  {
    for (let i = 0; i < arr.length; i++) {
      arr[i].Date = this.ISO8601FormatParser(arr[i].Date);
      
    }
  }

  private ISO8601FormatParser(isoDate:string):string
  {
    let date = new Date(isoDate);
    let year = date.getFullYear();
    let month = date.getMonth()+1;
    this.monthsSet.add(this.monthsList[month-1]);
    let dt = date.getDate();
    let day:string;
    let montStr:string;

    if (dt < 10)
    {
      day = '0' + dt;
    }
    else
      day = `${dt}`;

    if (month < 10)
    {
      montStr = '0' + month;
    }
    else  
      montStr=`${month}`;

    
      
    return (`${montStr}/${day}/${year}`);
  }

  UpdateLineChartLabels()
  {
    this.monthsArr = Array.from(this.monthsSet);
    this.lineChartLabels=this.monthsArr;
    this.lineChartData =
    [
      { data: this.confirmedDataset, label: 'Confirmed' },
      { data: this.deathsDataset, label: 'Deaths' },
      { data: this.recoveredDataset, label: 'Recovered' },
      { data: this.activeDataset, label: 'Active' }
    ];
  }

  GetDatasets()
  {
    for (let i = 0; i < this.listOfCases.length; i++)
    {
      if(this.listOfCases[i+1]!=null)
      {
        let date1 = new Date(this.listOfCases[i].Date);
        let month1 = date1.getMonth();
        
        let date2 = new Date(this.listOfCases[i+1].Date);
        let month2 = date2.getMonth();
        if(month1<month2) //last day of month
        {
          //save datasets
          this.confirmedDataset.push(this.listOfCases[i].Confirmed);
          this.recoveredDataset.push(this.listOfCases[i].Recovered);
          this.deathsDataset.push(this.listOfCases[i].Deaths);
          this.activeDataset.push(this.listOfCases[i].Active);
        }
      }
    }

    let last_index = this.listOfCases.length-1;

    //save data of the last reported case 
    this.confirmedDataset.push(this.listOfCases[last_index].Confirmed);
    this.recoveredDataset.push(this.listOfCases[last_index].Recovered);
    this.deathsDataset.push(this.listOfCases[last_index].Deaths);
    this.activeDataset.push(this.listOfCases[last_index].Active);
    
    this.UpdateLineChartLabels();
  }
}