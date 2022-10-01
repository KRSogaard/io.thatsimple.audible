import React, { useState, useEffect, FunctionComponent } from 'react';
import { IYearResult } from '../Simulator';
import { Controller, Control } from 'react-hook-form';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControl from '@mui/material/FormControl';
import { isNumeric, formatNumber } from '../utils';

interface SettingsInputFieldProps {
    fieldName: string;
    fieldLable: string;
    fieldValue: any;
    setFieldValue: (value: any) => void;
    prefix?: string | undefined;
    surfix?: string | undefined;
    rules: any;
    errors?: string[];
}

function SettingsInputField(props: SettingsInputFieldProps) {
    let inputProps = {} as any;
    if (props.prefix) {
        inputProps.startAdornment = <InputAdornment position="start">{props.prefix}</InputAdornment>;
    }
    if (props.surfix) {
        inputProps.endAdornment = <InputAdornment position="end">{props.surfix}</InputAdornment>;
    }

    React.useEffect(() => {
        let formatted = formatNumber(props.fieldValue);
        console.log('Created: ', props.fieldValue, formatted);
        if (props.fieldValue !== formatted) {
            props.setFieldValue(formatted);
        }
    }, []);

    let onChange = (e: any) => {
        if (!e.target.value || e.target.value === '' || e.target.value === undefined) {
            props.setFieldValue('');
            return;
        }

        let numStr = cleanNumber(e.target.value);

        if (!isNumeric(numStr)) {
            console.log(e.target.value, 'Is not a number');
            return;
        }

        let num = Number(e.target.value);
        console.log('onChange: ', num, props.rules.min, props.rules.max);
        if (props.rules && props.rules.min && Number(e.target.value) < props.rules.min) {
            console.log(e.target.value, 'Is less than min');
            return;
        }
        if (props.rules && props.rules.max && Number(e.target.value) > props.rules.max) {
            console.log(e.target.value, 'Is less than max');
            return;
        }
        props.setFieldValue(formatNumber(e.target.value));
    };

    let cleanNumber = (value: string) => {
        return value.replace(/,/g, '');
    };

    return (
        <FormControl fullWidth sx={{ m: 1 }}>
            <TextField
                label={props.fieldLable}
                id="outlined-size-small"
                size="small"
                name={props.fieldName}
                value={props.fieldValue}
                onChange={onChange}
                InputProps={inputProps}
            />
        </FormControl>
    );
}

export default SettingsInputField;
