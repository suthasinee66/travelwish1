export function getUserLocation(): Promise<{
  latitude: number;
  longitude: number;
}> {

  return new Promise((resolve, reject) => {

    if (!navigator.geolocation) {
      reject(
        new Error("Browser does not support geolocation")
      );
      return;
    }


    navigator.geolocation.getCurrentPosition(

      (position) => {

        resolve({

          latitude:
            position.coords.latitude,


          longitude:
            position.coords.longitude,

        });

      },


      (error) => {

        reject(error);

      },


      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }

    );

  });

}