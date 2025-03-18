# Projekt: Aplikacja do pobierania i generowania CSV z zamówieniami

Aplikacja stworzona w Node.js, która pobiera dane zamówień z zewnętrznego API, przetwarza je, a następnie umożliwia generowanie pliku CSV z zamówieniami. Funkcjonalność obejmuje zabezpieczenie endpointów poprzez autoryzację podstawową i umożliwia filtrowanie zamówień na podstawie wartości zamówienia.

## Funkcje

- **Autoryzacja użytkownika**
- **Generowanie pliku CSV**
- **Codzienne pobieranie zamówień**

## Instalacja

1. Sklonuj repozytorium:

    ```bash
    git clone https://github.com/yourusername/projectname.git
    cd projectname
    ```

2. Zainstaluj zależności:

    ```bash
    npm install
    ```

3. Skonfiguruj plik `.env` z danymi do autoryzacji oraz API:

    Utwórz plik `.env` w głównym katalogu projektu i dodaj do niego zmienne:

    ```
    AUTH_NAME=
    AUTH_PASS=
    API_KEY=
    ```

## Uruchomienie aplikacji

```bash
npm run start
