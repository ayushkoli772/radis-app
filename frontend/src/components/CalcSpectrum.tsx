import React, { useState } from "react";
import axios from "axios";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Grid from "@mui/material/Grid";
import { Controller, useForm } from "react-hook-form";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import CircularProgress from "@mui/material/CircularProgress";
import { CalcSpectrumPlotData, CalcSpectrumResponseData } from "../constants";
import { FormValues } from "./types";
import { Database } from "./fields/Database";
import { Mode } from "./fields/Mode";
import { TGas } from "./fields/TGas";
import { TRot } from "./fields/TRot";
import { TVib } from "./fields/TVib";
import { Pressure } from "./fields/Pressure";
import { PathLength } from "./fields/PathLength";
import { Species } from "./fields/Species/Species";
import { SimulateSlit } from "./fields/SimulateSlit";
import { WavenumberRangeSlider } from "./fields/WavenumberRangeSlider";
import { CalcSpectrumButton } from "./fields/CalSpectrumButtom";
import { DownloadSpectrum } from "./fields/DownloadButton";
import { CalcSpectrumPlot } from "./CalcSpectrumPlot";
import { ErrorAlert } from "./ErrorAlert";

interface Response<T> {
  data?: T;
  error?: string;
}

export const CalcSpectrum: React.FC = () => {
  const [calcSpectrumResponse, setCalcSpectrumResponse] = React.useState<
    Response<CalcSpectrumResponseData> | undefined
  >(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [plotData, setPlotData] = useState<CalcSpectrumPlotData | undefined>(
    undefined
  );
  const [isNonEquilibrium, setIsNonEquilibrium] = useState(false);
  const [useGesia, setUseGesia] = useState(false);
  const [useSlit, setUseSlit] = useState(false); // checking that user wants to apply the slit function or not in available modes
  const [useSimulateSlitFunction, setUseSimulateSlitFunction] = useState(false); // checking the mode and enable or disable slit feature
  const Schema = yup.object().shape({
    useNonEqi: yup.boolean(),
    use_simulate_slit: yup.boolean(),
    path_length: yup
      .number()
      .required("Path length must be defined")
      .typeError("Path length must be defined")
      .min(1, "Path length cannot be negative"),
    pressure: yup
      .number()
      .required("Pressure must be defined")
      .typeError("Pressure must be defined")
      .min(1, "Pressure cannot be negative"),
    tgas: yup
      .number()
      .required("Tgas must be defined")
      .typeError("Tgas must be defined")
      .max(9000, "Tgas must be between 1K and 9000K")
      .min(1, "Tgas must be between 1K and 9000K"),
    trot: yup
      .number()
      .typeError("TRot must be defined")
      .when("useNonEqi", {
        is: true,
        then: yup
          .number()
          .required("Trot must be defined")
          .typeError("TRot must be defined")
          .min(0, "TRot must be positive"),
      }),
    tvib: yup
      .number()
      .typeError("TRot must be defined")
      .when("useNonEqi", {
        is: true,
        then: yup
          .number()
          .required("TVib must be defined")
          .typeError("TVib must be defined")
          .min(0, "TVib must be positive"),
      }),
    min_wavenumber_range: yup
      .number()
      .required("Min wavenumber range must be defined")
      .typeError("Min wavenumber range must be defined"),
    max_wavenumber_range: yup
      .number()
      .required("Max wavenumber range must be defined")
      .typeError("Max wavenumber range must be defined"),
    species: yup.array().of(
      yup.object().shape({
        molecule: yup
          .string()
          .required("Molecule must be defined")
          .typeError("Molecule must be defined"),
        mole_fraction: yup
          .number()
          .required("Mole fraction must be defined")
          .typeError("Mole fraction must be defined"),
      })
    ),
    simulate_slit: yup
      .number()
      .typeError("Simulate slit must be defined")
      .min(0, "Simulate slit must be positive")
      .max(30, "Simulate slit must be less than 30")
      .when("useSlitSwitch", {
        is: true,
        then: yup
          .number()
          .typeError("Simulate slit must be defined")
          .min(0, "Simulate slit must be positive")
          .max(30, "Simulate slit must be less than 30"),
      }),
  });
  const { control, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: { species: [{ molecule: "CO", mole_fraction: 0.1 }] },
    resolver: yupResolver(Schema),
  });

  const handleBadResponse = (message: string) => {
    setCalcSpectrumResponse(undefined);
    setError(message);
  };
  const onSubmit = async (data: FormValues): Promise<void> => {
    if (useSlit == true) {
      if (data.mode === "radiance_noslit") {
        data.mode = "radiance";
      }
      if (data.mode === "transmittance_noslit") {
        data.mode = "transmittance";
      }
    }

    setLoading(true);
    console.log(data);
    setError(undefined);

    setPlotData({
      max_wavenumber_range: data.max_wavenumber_range,
      min_wavenumber_range: data.min_wavenumber_range,
      mode: data.mode,
      species: data.species,
    });
    import(/* webpackIgnore: true */ "./config.js").then(async (module) => {
      const rawResponse = await axios.post(
        module.apiEndpoint + `calculate-spectrum`,
        data
      );
      if (
        rawResponse.data.data === undefined &&
        rawResponse.data.error === undefined
      ) {
        handleBadResponse("Bad response from backend!");
      } else {
        const response = await rawResponse.data;
        if (response.error) {
          handleBadResponse(response.error);
        } else {
          setCalcSpectrumResponse(response);
        }
      }
      setLoading(false); //setLoading(false) is called after the response is received
    });
  };
  //testing endpoint
  const apiEndpoint = "http://localhost:5000/";
  const downloadSpectrum = async (): Promise<> => {
    const fileResponse = axios
      .get(`${apiEndpoint}download-spectrum`)
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const databaseWatch = watch("database");
  const modeWatch = watch("mode");

  React.useEffect(() => {
    if (databaseWatch === "geisa") {
      setUseGesia(true);
    } else {
      setUseGesia(false);
    }
    if (modeWatch === "absorbance") {
      setUseSimulateSlitFunction(false);
    } else {
      setUseSimulateSlitFunction(true);
    }
    if (modeWatch === "absorbance") {
      setValue("simulate_slit", undefined);
    } else {
      setValue("simulate_slit", 5);
    }
  }, [databaseWatch, modeWatch]);

  const UseNonEquilibriumCalculations = () => (
    <Controller
      name="useNonEqi"
      defaultValue={false}
      control={control}
      render={({ field }) => (
        <FormControlLabel
          label="Use non-equilibrium calculations"
          control={
            <Switch
              checked={isNonEquilibrium}
              onChange={(event, value) => {
                setIsNonEquilibrium(event.target.checked);
                field.onChange(value);
                if (event.target.checked) {
                  setValue("tvib", 300);
                  setValue("trot", 300);
                } else {
                  setValue("tvib", undefined);
                  setValue("trot", undefined);
                }
              }}
            />
          }
        />
      )}
    />
  );
  const UseSimulateSlit = () => (
    <Controller
      name="use_simulate_slit"
      defaultValue={false}
      control={control}
      render={({ field }) => (
        <FormControlLabel
          label="Apply Instrumental Slit Function"
          control={
            <Switch
              checked={useSlit}
              onChange={(event, value) => {
                setUseSlit(event.target.checked);
                field.onChange(value);
                if (event.target.checked) {
                  setValue("simulate_slit", 5);
                } else {
                  setValue("simulate_slit", undefined);
                }
              }}
            />
          }
        />
      )}
    />
  );
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {error ? <ErrorAlert message={error} /> : null}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={8} md={5} lg={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={8} md={5} lg={5}>
              <Database control={control}></Database>
            </Grid>
            <Grid item xs={12} sm={8} md={5} lg={6}>
              <Mode control={control} />
            </Grid>
            <Grid item xs={12}>
              <WavenumberRangeSlider
                minRange={500}
                maxRange={10000}
                control={control}
                setValue={setValue}
              />
            </Grid>

            <Grid item sm={8} lg={4}>
              <TGas control={control} />
            </Grid>

            {isNonEquilibrium ? (
              <>
                <Grid item sm={8} lg={3}>
                  <TRot control={control} />
                </Grid>
                <Grid item sm={8} lg={3}>
                  <TVib control={control} />
                </Grid>
              </>
            ) : null}

            <Grid item sm={8} lg={5}>
              <Pressure control={control} />
            </Grid>

            <Grid item sm={8} lg={3}>
              <PathLength control={control} />
            </Grid>

            <Grid item xs={12}>
              <Species
                isNonEquilibrium={false}
                control={control}
                isGeisa={false}
              />
            </Grid>

            {useSimulateSlitFunction ? (
              <Grid item xs={12}>
                <UseSimulateSlit />
              </Grid>
            ) : null}

            {useSimulateSlitFunction ? (
              useSlit ? (
                <Grid item xs={12}>
                  <SimulateSlit control={control} />
                </Grid>
              ) : null
            ) : null}
            {useGesia ? null : (
              <Grid item xs={12}>
                <UseNonEquilibriumCalculations />
              </Grid>
            )}

            <Grid item xs={12}>
              <CalcSpectrumButton />
            </Grid>
            <DownloadSpectrum />
          </Grid>
        </Grid>

        <Grid item xs={12} sm={5} md={7} lg={8}>
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 230,
              }}
            >
              <CircularProgress />
            </div>
          ) : (
            calcSpectrumResponse?.data &&
            plotData?.species && (
              <CalcSpectrumPlot
                data={calcSpectrumResponse.data}
                species={plotData.species}
                min_wavenumber_range={plotData.min_wavenumber_range}
                max_wavenumber_range={plotData.max_wavenumber_range}
                mode={plotData.mode}
              />
            )
          )}
        </Grid>
      </Grid>
    </form>
  );
};
