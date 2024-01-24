/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `sync` command */
  export type Sync = ExtensionPreferences & {
  /** Obsidian Vault Path - Obsidian Vault Path Location */
  "vault": string,
  /** ToDos folder - What Folder to read Todos from, comma separated */
  "todos_folder": string,
  /** Email Folder File - What folder to write saved emails to */
  "emailFolder": string
}
}

declare namespace Arguments {
  /** Arguments passed to the `sync` command */
  export type Sync = {}
}


declare module "swift:*" {
  function run<T = unknown, U = any>(command: string, input?: U): Promise<T>;
  export default run;
	export class SwiftError extends Error {
    stderr: string;
    stdout: string;
  }
}
