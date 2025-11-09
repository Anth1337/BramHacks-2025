const HOST: string = 'localhost';
const PORT: number = 4000;
const baseUrl: string = `http://${HOST}:${PORT}`;


export const getAsteroids = async (
    page: number = 0,
    params: Record<string, string | number | boolean> = {}
): Promise<any> =>
{
    const init = {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    }

    const qs = new URLSearchParams({ page: String(page) });
    Object.entries(params).forEach(([k, v]) =>
    {
        if (v !== undefined && v !== null) qs.set(k, String(v));
    });

    const url = `${baseUrl}/asteroids?${qs.toString()}`;
    const response = await fetch(url, init);
    if (!response.ok)
    {
        throw new Error(`Error fetching asteroids: ${response.statusText}`);
    }
    return await response.json();
}


export const getAsteroid = async (
    params: Record<string, string | number | boolean> = {}
): Promise<any> =>
{
    const init = {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    }

    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) =>
    {
        if (v !== undefined && v !== null) qs.set(k, String(v));
    });

    const url = `${baseUrl}/asteroid/${params.id}?${qs.toString()}`;
    const response = await fetch(url, init);
    if (!response.ok)
    {
        throw new Error(`Error fetching asteroids: ${response.statusText}`);
    }
    return await response.json();
}


export const getDriftData = async (
  params: Record<string, string | number | boolean> = {}
): Promise<any> => {
  const init = {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json", // 👈 required
    },
    body: JSON.stringify(params),
  };

  const url = `${baseUrl}/predict`;
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`Error fetching drift data: ${response.statusText}`);
  }

  return await response.json(); // returns { da_dt, units }
};
