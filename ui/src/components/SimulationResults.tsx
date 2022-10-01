import React, { useState, useEffect, FunctionComponent } from 'react';
import { ISimulationResult, IYearResult } from '../Simulator';
import CurrencyFormat from 'react-currency-format';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import SimulationResultRow from './SimulationResultRow';

interface SimulationResultsProps {
    result: ISimulationResult | undefined;
}

function SimulationResults(props: SimulationResultsProps) {
    let years: IYearResult[] = [];
    if (props.result !== undefined) {
        years = props.result.years;
    }

    return (
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} size="small" aria-label="simple table">
                <TableHead>
                    <TableRow>
                        <TableCell>Year</TableCell>
                        <TableCell align="right" title="Pre-tax casflow devided by the total acquisition cost">
                            Cash on Cash Return
                        </TableCell>
                        <TableCell align="right" title="Post-tax casflow devided by the total acquisition cost">
                            Cash on Cash Return (Post-Tax)
                        </TableCell>
                        <TableCell align="right" title="Total cashflow before tax">
                            Cashflow (Pre-Tax)
                        </TableCell>
                        <TableCell align="right" title="Total cashflow after tax">
                            Cashflow (Post-Tax)
                        </TableCell>
                        <TableCell title="Net operational Income / Total acquisition cost, this dose not include mortages and taxes">CapRate</TableCell>
                        <TableCell title="The annual return based sale of the property plus post tax cash flow devided by the total acquisition cost">
                            Total Property Sale Return
                        </TableCell>
                        <TableCell title="Net operational income: Rent income minus operation expenses such as insurance, utilites, maintenance, management fee and property tax">
                            NOI
                        </TableCell>
                        <TableCell title="Rent income minus vacancy and operation expenses such as insurance, utilites, maintenance, management fee and property tax">
                            Operating Income
                        </TableCell>
                        <TableCell title="Cash left after sale, and all expenses has been paid">Cash after property sale</TableCell>
                        <TableCell title="all expenses, including taxes">Total expenses</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>{years && years.map((year) => <SimulationResultRow key={'SimulationYear' + year.year} year={year} />)}</TableBody>
            </Table>
        </TableContainer>
    );
}

export default SimulationResults;
