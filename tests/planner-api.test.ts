import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createPlannerTask,
  deletePlannerTask,
  getPlannerOverview,
  getWeeklyPlan,
  togglePlannerTaskCompletion,
  updatePlannerTask,
  updateWeeklyGoals,
  updateWeeklyPlan,
  getTodaySummary,
} from '../lib/planner-api';

describe('planner-api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('deve chamar /planner/overview com query de data se fornecida', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        week: [],
        habits: [],
        todayTasks: [],
        weeklyGoals: [],
        summary: {
          tasksCompletedToday: 0,
          tasksTotalToday: 0,
          studyMinutesToday: 0,
          currentStreakDays: 5,
          longestStreakDays: 10,
          todayDateLabel: 'Quinta-feira, 27 de Agosto',
        },
      }),
    } as Response);

    const data = await getPlannerOverview('2026-08-27');
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/planner/overview?date=2026-08-27'),
      expect.anything(),
    );
    expect(data.summary.currentStreakDays).toBe(5);
  });

  it('deve chamar /planner/week com parâmetros corretos', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'plan-1',
        userId: 'user-1',
        year: 2026,
        weekNumber: 35,
        startDate: '2026-08-24',
        endDate: '2026-08-30',
        status: 'ACTIVE',
        notes: null,
        goals: [],
        createdAt: '2026-08-27T00:00:00Z',
        updatedAt: '2026-08-27T00:00:00Z',
      }),
    } as Response);

    const plan = await getWeeklyPlan({ year: 2026, weekNumber: 35 });
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/planner/week?year=2026&weekNumber=35'),
      expect.anything(),
    );
    expect(plan.id).toBe('plan-1');
  });

  it('deve atualizar metas semanais via PUT /planner/weeks/:id/goals', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'plan-1',
        userId: 'user-1',
        goals: [
          {
            id: 'g1',
            category: 'IMMERSION',
            targetValue: 450,
            currentValue: 120,
            percentage: 27,
            unit: 'min',
          },
        ],
      }),
    } as Response);

    const result = await updateWeeklyGoals('plan-1', [
      { category: 'IMMERSION', targetValue: 450, unit: 'min' },
    ]);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/planner/weeks/plan-1/goals'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          goals: [{ category: 'IMMERSION', targetValue: 450, unit: 'min' }],
        }),
      }),
    );
    expect(result.id).toBe('plan-1');
  });

  it('deve criar tarefa via POST /planner/tasks', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'task-new-1',
        userId: 'user-1',
        title: 'Revisar Kanji N4',
        category: 'KANJI',
        date: '2026-08-27',
        status: 'PENDING',
      }),
    } as Response);

    const task = await createPlannerTask({
      title: 'Revisar Kanji N4',
      category: 'KANJI',
      date: '2026-08-27',
      estimatedMinutes: 20,
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/planner/tasks'),
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(task.id).toBe('task-new-1');
  });

  it('deve alternar status de conclusão da tarefa via PATCH /planner/tasks/:id/complete', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'task-1',
        status: 'COMPLETED',
        completedAt: '2026-08-27T10:00:00Z',
      }),
    } as Response);

    const result = await togglePlannerTaskCompletion('task-1', {
      completed: true,
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/planner/tasks/task-1/complete'),
      expect.objectContaining({
        method: 'PATCH',
      }),
    );
    expect(result.status).toBe('COMPLETED');
  });

  it('deve excluir tarefa via DELETE /planner/tasks/:id', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, id: 'task-1' }),
    } as Response);

    const res = await deletePlannerTask('task-1');
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/planner/tasks/task-1'),
      expect.objectContaining({
        method: 'DELETE',
      }),
    );
    expect(res.success).toBe(true);
  });

  it('deve buscar resumo de hoje via GET /planner/summary/today', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        totalTasks: 10,
        completedTasks: 5,
        pendingTasks: 5,
        completionPercentage: 50,
        minutesStudied: 45,
        categoriesStudied: ['KANJI', 'VOCABULARY'],
        streak: 3,
      }),
    } as Response);

    const summary = await getTodaySummary();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/planner/summary/today'),
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect(summary.totalTasks).toBe(10);
    expect(summary.completedTasks).toBe(5);
    expect(summary.streak).toBe(3);
  });

  it('deve lidar com erro ao alternar status de tarefa', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    } as Response);

    await expect(
      togglePlannerTaskCompletion('task-1', { completed: true })
    ).rejects.toThrow();
  });

  it('deve lidar com erro ao criar tarefa', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Invalid input',
    } as Response);

    await expect(
      createPlannerTask({
        title: 'Test',
        date: '2026-08-27',
      })
    ).rejects.toThrow();
  });

  it('deve atualizar tarefa via PATCH /planner/tasks/:id', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'task-1',
        title: 'Updated Task',
        status: 'PENDING',
      }),
    } as Response);

    const result = await updatePlannerTask('task-1', {
      title: 'Updated Task',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/planner/tasks/task-1'),
      expect.objectContaining({
        method: 'PATCH',
      }),
    );
    expect(result.title).toBe('Updated Task');
  });

  it('deve atualizar plano semanal via PATCH /planner/weeks/:id', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'plan-1',
        status: 'COMPLETED',
        notes: 'Week completed',
      }),
    } as Response);

    const result = await updateWeeklyPlan('plan-1', {
      status: 'COMPLETED',
      notes: 'Week completed',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/planner/weeks/plan-1'),
      expect.objectContaining({
        method: 'PATCH',
      }),
    );
    expect(result.status).toBe('COMPLETED');
  });
});
