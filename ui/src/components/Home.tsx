import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';
import Header from './Header';
import { SaveService } from '../services/SaveService';
import { Settings } from './Settings';
import { ISettings, ISimulationResult, IYearResult, runSimulation } from '../Simulator';
import SimulationResults from './SimulationResults';
import Grid from '@mui/material/Unstable_Grid2';

function Home() {
    // const [tasks, setTasks] = useState([])
    // const [numberOfTasks, setNumberOfTasks] = useState<number>(0)
    const [settings, setSetSettings] = useState<ISettings | undefined>();
    const [result, setResult] = useState<ISimulationResult>();
    const [outOfPocket, setOutOfPocket] = useState<number>(0);

    const saveService = new SaveService();

    useEffect(() => {
        if (!settings) return;
        let simulator = runSimulation(settings, 30);
        setResult(simulator);
    }, [settings]);

    let onSettingsChange = (input: ISettings) => {
        setSetSettings(input);
    };

    let round = (x: number): number => {
        return Math.round(x * 100) / 100;
    };

    return (
        <div className="App">
            {/* <Header></Header> */}
            <Grid container spacing={2} margin={2}>
                <Grid xs={12} md={3}>
                    <Settings
                        onSettingsChange={onSettingsChange}
                        defaults={{
                            PurchasePrice: 475000,
                            LandValuePtc: 0.4,
                            DownPaymentPtc: 0.25,
                            LoanFee: 1500,
                            EscrowPtc: 0.01,
                            LoanPtc: 0.06,
                            LoanTerms: 360,
                            RentIncome: 4100,
                            RemodelCost: 50000,
                            RemodelValueIncrease: 50000,
                            ManagementFeePtc: 0,
                            MaintenanceCostPtc: 0.05,
                            TaxRatePtc: 0.25,
                            PropertyTaxPtc: 0.0075,
                            VacancyRatePtc: 0.05,
                            AnnualAppreciationPtc: 0.01,
                            AnnualRentPtc: 0.01,
                            AnnualUtilities: 0,
                            AnnualInsurance: 2500,
                            AnnualOtherCost: 1500,
                            SalesFeesPtc: 0.03,
                        }}
                    />
                </Grid>
                <Grid xs={12} md={9}>
                    <SimulationResults result={result} />
                </Grid>
            </Grid>
        </div>
    );
}

export default Home;
