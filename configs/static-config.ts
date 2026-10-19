import type {RzmNuxtStaticConfig} from '@razomy/nuxt/runtime/functions';
import {i18n} from "../i18n/translates";

const subdomainName = 'io' as const;
const domain = `${subdomainName}.razomy.org` as const;
export const url = `https://${domain}` as const;
export const cookie = {
  session: {
    locale: `${subdomainName}.razomy.org-session-locale`,
    token: `auth${subdomainName}-session-token`,
  }
} as const;

// import {Project} from 'ts-morph';
// import * as tsRl from '@razomy/ts-rl';
// import path from "path";
//
//
// const project = new Project();
// project.addSourceFilesAtPaths('/Users/yevhenii_kamenskyi/resource/razomy/code/js.chunk/razomy/array/dist/**/*.+(mts)');
// project.addSourceFileAtPath(path.join('/Users/yevhenii_kamenskyi/resource/razomy/code/js.chunk/razomy/array/dist', 'package.json'));
// const ast = tsRl.ast.bindings.getPackage(project, '/Users/yevhenii_kamenskyi/resource/razomy/code/js.chunk/razomy/array/dist');
// const ctx: tsRl.hir.HirCtx = {
//   root: null,
//   nodes: new Map(),
// };
// ctx.root = tsRl.hir.astToHirNode(ast);
// tsRl.hir.indexNodes(ctx, ctx.root);
// tsRl.hir.linkHirTree(ctx, ctx.root);
// tsRl.hir.joinDocs(ctx, ctx.root);

function onlyUnique<T extends { runProvider: { packageName: string } }>(value: T, index: number, array: T[]) {
  return array.findIndex(i => i.runProvider.packageName === value.runProvider.packageName) === index;
}


export const c = {
  url,
  cookie,
  i18n,
  // runtimeConfig: {
  //   public: {
  //     cookie,
  //     firebaseConfig: JSON.parse(process.env['FIREBASE_CONFIG_JSON']!),
  //   }
  // }
};
