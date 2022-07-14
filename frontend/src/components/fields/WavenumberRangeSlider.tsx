//TODO: in progress
import React from "react";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import Input from "@material-ui/core/Input";
import {
  Control,
  Controller,
  FieldValues,
  UseFormSetValue,
} from "react-hook-form";
// import { FormValues } from "../types";
import Grid from "@mui/material/Grid";
// import { makeStyles } from "@mui/material/styles";
interface WavelengthRangeSliderProps {
  minRange: number;
  maxRange: number;
  control: Control<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
}
// const useStyles = makeStyles({
//   input: {
//     width: 52,
//   },
// });
export const WavenumberRangeSlider: React.FC<WavelengthRangeSliderProps> = ({
  minRange,
  maxRange,
  control,
  setValue,
}) => {
  // const classes = useStyles();
  const [lowerRange, setLowerRange] = React.useState<number | "">(1900);
  const [upperRange, setUpperRange] = React.useState<number | "">(2300);
  React.useEffect(() => {
    setValue("min_wavenumber_range", lowerRange === "" ? minRange : lowerRange);
    setValue("max_wavenumber_range", upperRange === "" ? maxRange : upperRange);
  }, [lowerRange, upperRange]);
  const handleSliderChange = (
    // eslint-disable-next-line @typescript-eslint/ban-types
    _event: React.ChangeEvent<{}>,
    value: number | number[]
  ) => {
    value = value as [number, number];
    setLowerRange(value[0]);
    setUpperRange(value[1]);
  };
  const handleBlur = () => {
    if (lowerRange > upperRange) {
      return;
    }
    if (lowerRange < minRange) {
      setLowerRange(minRange);
    }
    if (upperRange > maxRange) {
      setUpperRange(maxRange);
    }
  };
  const rangeInput = (
    id: string,
    onChange: (...event: any[]) => void,
    value:
      | FieldValues["min_wavenumber_range"]
      | FieldValues["max_wavenumber_range"]
  ) => (
    <Input
      fullWidth
      id={id}
      // className={classes.input}
      value={value}
      margin="dense"
      onChange={(e) =>
        onChange(e.target.value === "" ? "" : Number(e.target.value))
      }
      onBlur={handleBlur}
      inputProps={{
        min: minRange,
        max: maxRange,
        type: "number",
        "aria-labelledby": "input-slider",
      }}
    />
  );

  return (
    <div>
      <Typography id="input-slider" gutterBottom>
        Wavenumber range (cm⁻¹)
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <Controller
            name="min_wavenumber_range"
            control={control}
            defaultValue={minRange}
            render={({ field: { onChange, value } }) =>
              rangeInput("min-wavenumber-input", onChange, value)
            }
          />
        </Grid>
        <Grid item xs>
          <Slider
            value={[
              lowerRange === "" ? minRange : lowerRange,
              upperRange === "" ? maxRange : upperRange,
            ]}
            onChange={handleSliderChange}
            aria-labelledby="input-slider"
            min={minRange}
            max={maxRange}
          />
        </Grid>
        <Grid item>
          <Controller
            name="max_wavenumber_range"
            control={control}
            defaultValue={maxRange}
            render={({ field: { onChange, value } }) =>
              rangeInput("max-wavenumber-input", onChange, value)
            }
          />
        </Grid>
      </Grid>
    </div>
  );
};
