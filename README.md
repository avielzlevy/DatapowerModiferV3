# DatapowerModiferV3

A Node.js tool for managing IBM DataPower appliances, allowing you to enable/disable, quiesce/unquiesce, and change properties of domains, MultiProtocol Gateways (MPGW), Front Side Handlers (FSH), and Queue Managers via the DataPower REST Management API.

## Features

- Connects to multiple DataPower appliances
- Filters domains and objects by mask
- Supports actions: Enable, Disable, Quiesce, Unquiesce, ChangeProperties, ShowProperties
- Saves and displays object properties
- Interactive CLI with confirmation prompts and spinners

## Setup

1. **Clone the repository**
2. **Install dependencies**
   ```sh
   npm install
   ```
3. **Configure environment variables**
   Copy `.env.example` to `.env` and adjust as needed:
   ```sh
   cp .env.example .env
   ```
4. **Edit configuration**
   Modify `js/config.js` to set your DataPower appliances, domain/object masks, actions, and properties.
5. **Run the application**
   ```sh
   npm start
   ```

## Configuration

- **Environment variables**: See `.env.example`
- **Properties**: See `properties.json` for available properties per object type.
- **Output**: Properties can be saved to `output_properties.json`.

## License

ISC
