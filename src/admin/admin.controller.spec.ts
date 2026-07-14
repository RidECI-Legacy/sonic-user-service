import { AdminController } from './admin.controller';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: {
    getDashboard: jest.Mock;
    updateUserStatus: jest.Mock;
    getPendingRoleUsers: jest.Mock;
    assignUserRole: jest.Mock;
    exportUsersReport: jest.Mock;
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    findPendingVerifications: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    verifyDriver: jest.Mock;
  };

  beforeEach(() => {
    adminService = {
      getDashboard: jest.fn(),
      updateUserStatus: jest.fn(),
      getPendingRoleUsers: jest.fn(),
      assignUserRole: jest.fn(),
      exportUsersReport: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findPendingVerifications: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      verifyDriver: jest.fn(),
    };
    controller = new AdminController(adminService as never);
  });

  it('getDashboard delegates to adminService', () => {
    void controller.getDashboard();
    expect(adminService.getDashboard).toHaveBeenCalled();
  });

  it('updateUserStatus delegates with id and dto', () => {
    const dto = { status: 'suspendido' } as never;
    void controller.updateUserStatus('user-1', dto);
    expect(adminService.updateUserStatus).toHaveBeenCalledWith('user-1', dto);
  });

  it('getPendingRoleUsers delegates to adminService', () => {
    void controller.getPendingRoleUsers();
    expect(adminService.getPendingRoleUsers).toHaveBeenCalled();
  });

  it('assignUserRole delegates with id and dto', () => {
    const dto = { role: 'STUDENT' } as never;
    void controller.assignUserRole('user-1', dto);
    expect(adminService.assignUserRole).toHaveBeenCalledWith('user-1', dto);
  });

  it('exportUsersReport sets headers and sends the buffer', async () => {
    const buffer = Buffer.from('fake-xlsx');
    adminService.exportUsersReport.mockResolvedValue(buffer);
    const res = { set: jest.fn(), send: jest.fn() };

    await controller.exportUsersReport(res as never);

    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    );
    expect(res.send).toHaveBeenCalledWith(buffer);
  });

  it('create/findAll/findOne/update/remove/findPendingVerifications delegate to adminService', () => {
    controller.create({});
    expect(adminService.create).toHaveBeenCalled();

    controller.findAll();
    expect(adminService.findAll).toHaveBeenCalled();

    controller.findOne('1');
    expect(adminService.findOne).toHaveBeenCalledWith(1);

    void controller.findPendingVerifications();
    expect(adminService.findPendingVerifications).toHaveBeenCalled();

    controller.update('1', {});
    expect(adminService.update).toHaveBeenCalledWith(1, {});

    controller.remove('1');
    expect(adminService.remove).toHaveBeenCalledWith(1);
  });

  it('verifyDriver delegates with profileId and dto', () => {
    const dto = { status: 'VERIFIED' } as never;
    void controller.verifyDriver('profile-1', dto);
    expect(adminService.verifyDriver).toHaveBeenCalledWith('profile-1', dto);
  });
});
