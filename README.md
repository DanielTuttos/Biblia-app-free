# Biblia

App de lectura bíblica multiplataforma (iOS, Android y web) construida con [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/) y [Expo Router](https://docs.expo.dev/router/introduction/).

Incluye lectura por libros y capítulos, lectura del día, búsqueda offline, descarga de traducciones completas y ajustes de idioma, traducción, tema y tamaño de fuente.

## Requisitos

- [Node.js](https://nodejs.org/) 20 LTS o superior
- npm (incluido con Node.js)
- Para probar en dispositivo físico: [Expo Go](https://expo.dev/go) (iOS / Android)
- Para emuladores (opcional):
  - **iOS:** macOS con [Xcode](https://docs.expo.dev/workflow/ios-simulator/)
  - **Android:** [Android Studio](https://docs.expo.dev/workflow/android-studio-emulator/) con un emulador configurado

## Instalación

Clona el repositorio, entra en la carpeta del proyecto e instala dependencias:

```bash
git clone <url-del-repositorio>
cd biblia
npm install
```

## Ejecutar el proyecto

Inicia el servidor de desarrollo de Expo:

```bash
npm start
```

También puedes usar estos atajos:

| Comando | Descripción |
|---------|-------------|
| `npm start` | Abre el menú de Expo (QR, teclas de acceso rápido) |
| `npm run ios` | Abre en simulador iOS |
| `npm run android` | Abre en emulador Android |
| `npm run web` | Abre en el navegador |
| `npm run lint` | Ejecuta ESLint |

### Probar en tu teléfono

1. Ejecuta `npm start`.
2. Escanea el código QR con la cámara (iOS) o con la app Expo Go (Android).
3. Asegúrate de que el teléfono y la computadora estén en la misma red Wi‑Fi.

### Primera ejecución

La app necesita internet la primera vez para:

- Obtener la lista de traducciones disponibles
- Descargar la traducción seleccionada para uso offline (se hace automáticamente al abrir la app)

Después de la descarga inicial, puedes leer y buscar versículos sin conexión.

## Estructura del proyecto

```
app/                  Pantallas (Expo Router, file-based routing)
  (tabs)/             Pestañas: Inicio, Biblia, Ajustes
  book/               Selección de capítulo y versículo
  read/               Lectura a pantalla completa
components/bible/     Componentes de la UI bíblica
constants/            Traducciones, tema, lecturas del día
services/             API remota, descarga offline, lectura diaria
store/                Estado global (Zustand + AsyncStorage)
types/                Tipos TypeScript
utils/                Utilidades (navegación, enlaces externos)
```

## Variables de entorno

### ¿Se pueden poner los enlaces en un `.env`?

**Sí.** Expo soporta archivos `.env` de forma nativa. Las variables que quieras usar en el código de la app deben llevar el prefijo `EXPO_PUBLIC_`:

```bash
# .env
EXPO_PUBLIC_BIBLE_API_URL=https://bible.helloao.org/
```

En el código se leen así:

```typescript
const apiUrl = process.env.EXPO_PUBLIC_BIBLE_API_URL;
```

> **Importante:** reinicia el servidor (`npm start`) cada vez que cambies un archivo `.env`.

### Cómo funcionan en móvil (y por qué son distintas a un backend)

En una app móvil o web empaquetada con Expo, las variables `EXPO_PUBLIC_*` **se incluyen en el bundle de JavaScript en tiempo de compilación**. Eso implica:

| Aspecto | Comportamiento |
|---------|----------------|
| Visibilidad | Cualquier variable `EXPO_PUBLIC_` es **pública**; no la uses para secretos (API keys privadas, tokens, contraseñas). |
| Momento de lectura | Se resuelven al **arrancar Metro / hacer build**, no en runtime dinámico como en un servidor Node. |
| Plataformas | Funcionan igual en iOS, Android y web dentro del mismo proyecto Expo. |
| Builds de producción | Los valores del `.env` (o de EAS Secrets en CI) quedan embebidos en la app publicada. |

Para valores **realmente secretos** (por ejemplo, una clave de un servicio que no debe estar en el cliente), la práctica habitual es un backend propio que guarde el secreto y exponga solo endpoints seguros a la app.

### Configuración en este proyecto

La URL de la API se lee desde `EXPO_PUBLIC_BIBLE_API_URL` en `constants/api.ts`. Si no existe el archivo `.env`, se usa el valor por defecto `https://bible.helloao.org/`.

Para personalizarla:

1. Copia el archivo de ejemplo:

   ```bash
   cp .env.example .env
   ```

2. Edita `.env` si necesitas otra URL.

3. Reinicia el servidor de desarrollo (`npm start`).

El archivo `.env` está en `.gitignore`; `.env.example` sí se versiona como referencia.

### Archivos `.env` soportados por Expo

Expo carga automáticamente, por orden de prioridad:

- `.env`
- `.env.local`
- `.env.development` / `.env.production`
- `.env.development.local` / `.env.production.local`

Consulta la [documentación oficial de variables de entorno en Expo](https://docs.expo.dev/guides/environment-variables/) para más detalle.

## Datos y API

La app consume la [Free Use Bible API](https://bible.helloao.org/), que ofrece traducciones de dominio público o con licencias libres. Las traducciones destacadas por defecto están en `constants/translations.ts`.

Funcionalidades offline:

- Descarga del JSON completo de una traducción al almacenamiento del dispositivo
- Caché en AsyncStorage para peticiones recientes
- Búsqueda de versículos sobre el índice local cuando la traducción está descargada

## Scripts disponibles

Definidos en `package.json`:

- `start` — `expo start`
- `android` — `expo start --android`
- `ios` — `expo start --ios`
- `web` — `expo start --web`
- `lint` — `expo lint`

## Solución de problemas

**La app no carga traducciones**

- Comprueba que tienes conexión a internet.
- Verifica que `https://bible.helloao.org/` responde desde tu red.

**Cambios en `.env` no se aplican**

- Detén Metro (Ctrl+C) y vuelve a ejecutar `npm start`.

**Error al abrir en dispositivo físico**

- Usa la misma red Wi‑Fi en móvil y ordenador.
- En algunas redes corporativas o VPN, el QR no funciona; prueba con `npx expo start --tunnel`.

**Lint**

```bash
npm run lint
```

## Recursos

- [Documentación de Expo](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Variables de entorno en Expo](https://docs.expo.dev/guides/environment-variables/)
- [Free Use Bible API](https://bible.helloao.org/)
