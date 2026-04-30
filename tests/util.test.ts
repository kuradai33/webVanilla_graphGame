import { describe, it, expect } from 'vitest';
import { ReverseQueue } from '../src/util';

describe('ReverseQueue', () => {
    it('push は先頭（最新順）に挿入される', () => {
        const q = new ReverseQueue<number>();
        q.push(1);
        q.push(2);
        q.push(3);
        expect(q.range()).toEqual([3, 2, 1]);
    });

    it('size を超えたら末尾（最古）が脱落する', () => {
        const q = new ReverseQueue<number>([], 3);
        q.push(1);
        q.push(2);
        q.push(3);
        q.push(4);
        expect(q.length()).toBe(3);
        expect(q.range()).toEqual([4, 3, 2]);
    });

    it('pop が末尾（最古）を除去する', () => {
        const q = new ReverseQueue<number>();
        q.push(1);
        q.push(2);
        q.push(3);
        q.pop();
        expect(q.range()).toEqual([3, 2]);
    });

    it('length が push/pop を正確に追跡する', () => {
        const q = new ReverseQueue<number>();
        expect(q.length()).toBe(0);
        q.push(10);
        expect(q.length()).toBe(1);
        q.push(20);
        expect(q.length()).toBe(2);
        q.pop();
        expect(q.length()).toBe(1);
    });

    it('front が先頭要素を返す', () => {
        const q = new ReverseQueue<string>();
        q.push('a');
        q.push('b');
        expect(q.front()).toBe('b');
    });

    it('front が空キューで undefined を返す', () => {
        const q = new ReverseQueue<number>();
        expect(q.front()).toBeUndefined();
    });

    it('range が内部状態を汚染しないコピーを返す', () => {
        const q = new ReverseQueue<number>();
        q.push(1);
        q.push(2);
        const snapshot = q.range() as number[];
        snapshot.splice(0, 1);
        expect(q.length()).toBe(2);
        expect(q.range()).toEqual([2, 1]);
    });

    it('初期値ありコンストラクタで構築できる', () => {
        const q = new ReverseQueue<number>([10, 20, 30]);
        expect(q.length()).toBe(3);
        expect(q.range()).toEqual([10, 20, 30]);
    });

    it('size なしの場合は上限なし', () => {
        const q = new ReverseQueue<number>();
        for (let i = 0; i < 100; i++) q.push(i);
        expect(q.length()).toBe(100);
    });
});
