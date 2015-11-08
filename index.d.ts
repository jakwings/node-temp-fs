/*
 * Copyright (c) 2015 MEDIA CHECK s.r.o.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

interface dir {
  path: String;
  recursive: Boolean;
  unlink(callback?:(error:Error)=>any): any;
}

interface file {
  path: String;
  fd: Number;
  unlink(callback?:(error:Error)=>any): any;
}

interface options {
  dir?: String;
  limit?: Number;
  mode?: Number;
  name?: String;
  prefix?: String;
  recursive?: Boolean;
  suffix?: String;
  template?: String;
  track?: Boolean;
}

export declare function clear(callback?:()=>any):any;

export declare function clearSync():any;

export declare function dir():string;

export declare function mkdir(options?:options, callback?:(err:any, dir:dir)=>any):any;

export declare function mkdirSync(options?:options):dir;

export declare function name(options?:options):string;

export declare function open(options?:options, callback?:(err:any, file:file)=>any):any;

export declare function openSync(options?:options):file;

export declare function track(on?:Boolean):void;
